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
    const playlistId = searchParams.get('playlistId');

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YouTube API Key is not configured on the server' }, { status: 500 });
    }

    // 1. Fetch Playlist Info (to get the name)
    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
    );
    const plData = await plRes.json();
    
    if (plData.error) {
      return NextResponse.json({ error: plData.error.message }, { status: 400 });
    }
    
    if (!plData.items || plData.items.length === 0) {
      return NextResponse.json({ error: 'Playlist not found or is private' }, { status: 404 });
    }
    
    const playlistName = plData.items[0].snippet.title;

    // 2. Fetch Playlist Items (up to 50 tracks)
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`
    );
    const itemsData = await itemsRes.json();
    
    if (itemsData.error) {
      return NextResponse.json({ error: itemsData.error.message }, { status: 400 });
    }

    const validItems = itemsData.items.filter((item: any) => 
      item.snippet.resourceId.videoId && 
      item.snippet.title !== 'Private video' && 
      item.snippet.title !== 'Deleted video'
    );
    
    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No valid public videos found in playlist' }, { status: 404 });
    }

    const videoIds = validItems.map((item: any) => item.snippet.resourceId.videoId).join(',');

    // 3. Fetch Video Durations
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();
    
    // Create duration map
    const durationMap: Record<string, number> = {};
    if (videosData.items) {
      for (const video of videosData.items) {
        durationMap[video.id] = parseISODuration(video.contentDetails.duration);
      }
    }

    // 4. Map to our Track format
    const tracks: Track[] = validItems.map((item: any) => {
      const videoId = item.snippet.resourceId.videoId;
      const titleFull = item.snippet.title;
      const channel = item.snippet.videoOwnerChannelTitle || "Unknown Artist";
      
      // Attempt some basic parsing to separate artist from title if they use a dash
      let title = titleFull;
      let artist = channel.replace(" - Topic", "").replace("VEVO", "").trim();
      
      if (titleFull.includes(" - ")) {
        const parts = titleFull.split(" - ");
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }
      }

      return {
        id: `yt-${videoId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: title,
        artist: artist,
        film: "YouTube Import",
        year: new Date(item.snippet.publishedAt).getFullYear() || new Date().getFullYear(),
        duration: durationMap[videoId] || 0,
        videoId: videoId
      };
    });

    return NextResponse.json({ name: playlistName, tracks });

  } catch (error: any) {
    console.error("YouTube Import Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
