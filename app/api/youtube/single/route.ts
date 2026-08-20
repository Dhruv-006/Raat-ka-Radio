import { NextResponse } from 'next/server';
import { Track } from '@/app/components/playlist-data';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

function parseISODuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Basic validation: YouTube video IDs are 11 characters, alphanumeric + - _
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json({ error: 'Invalid YouTube video ID format' }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YouTube API Key is not configured on the server' }, { status: 500 });
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const data = await res.json();

    if (data.error) {
      if (data.error.code === 403) {
        return NextResponse.json(
          { error: 'YouTube API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Video not found. It may be deleted or private.' }, { status: 404 });
    }

    const video = data.items[0];

    // Check privacy
    if (video.status.privacyStatus !== 'public') {
      return NextResponse.json(
        { error: 'This video is not publicly available.' },
        { status: 403 }
      );
    }

    // Check embeddability
    if (!video.status.embeddable) {
      return NextResponse.json(
        { error: 'This video cannot be embedded. The creator has disabled embedding.' },
        { status: 403 }
      );
    }

    const titleFull = video.snippet.title;
    const channel = video.snippet.channelTitle || "Unknown Artist";

    let title = titleFull;
    let artist = channel.replace(" - Topic", "").replace("VEVO", "").trim();

    if (titleFull.includes(" - ")) {
      const parts = titleFull.split(" - ");
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(" - ").trim();
      }
    }

    const track: Track = {
      id: `yt-${videoId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      artist,
      film: "YouTube Import",
      year: new Date(video.snippet.publishedAt).getFullYear() || new Date().getFullYear(),
      duration: parseISODuration(video.contentDetails.duration),
      videoId
    };

    return NextResponse.json({ track });

  } catch (error: unknown) {
    console.error("YouTube Single Import Error:", error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
