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

interface PlaylistItemSnippet {
  resourceId: { videoId: string };
  title: string;
  videoOwnerChannelTitle?: string;
  publishedAt: string;
  position: number;
}

interface PlaylistItem {
  snippet: PlaylistItemSnippet;
}

interface VideoItem {
  id: string;
  contentDetails: { duration: string };
  status: { embeddable: boolean; privacyStatus: string };
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
      const status = plData.error.code === 403 ? 429 : 400;
      const message = plData.error.code === 403
        ? 'YouTube API quota exceeded. Please try again later.'
        : plData.error.message;
      return NextResponse.json({ error: message }, { status });
    }

    if (!plData.items || plData.items.length === 0) {
      return NextResponse.json({ error: 'Playlist not found or is private' }, { status: 404 });
    }

    const playlistName = plData.items[0].snippet.title;

    // 2. Fetch ALL Playlist Items with pagination
    const allItems: PlaylistItem[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const pageParam: string = nextPageToken ? `&pageToken=${nextPageToken}` : '';
      const itemsRes: Response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}${pageParam}&key=${YOUTUBE_API_KEY}`
      );
      const itemsData: { error?: { code: number; message: string }; items?: PlaylistItem[]; nextPageToken?: string } = await itemsRes.json();

      if (itemsData.error) {
        if (itemsData.error.code === 403) {
          return NextResponse.json(
            { error: 'YouTube API quota exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: itemsData.error.message }, { status: 400 });
      }

      if (itemsData.items) {
        allItems.push(...itemsData.items);
      }

      nextPageToken = itemsData.nextPageToken;
    } while (nextPageToken);


    // 3. Filter out private/deleted/unavailable videos
    const validItems = allItems.filter((item: PlaylistItem) =>
      item.snippet.resourceId.videoId &&
      item.snippet.title !== 'Private video' &&
      item.snippet.title !== 'Deleted video'
    );

    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No valid public videos found in playlist' }, { status: 404 });
    }

    // 4. Fetch Video Details in batches of 50 (duration + embeddability)
    const durationMap: Record<string, number> = {};
    const embeddableSet = new Set<string>();

    for (let i = 0; i < validItems.length; i += 50) {
      const batch = validItems.slice(i, i + 50);
      const videoIds = batch.map((item: PlaylistItem) => item.snippet.resourceId.videoId).join(',');

      try {
        const videosRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const videosData = await videosRes.json();

        if (videosData.error) {
          // If quota exceeded mid-batch, return what we have so far
          if (videosData.error.code === 403) {
            console.warn('YouTube API quota hit during video details fetch, continuing with partial data');
            break;
          }
          continue; // Skip this batch on other errors
        }

        if (videosData.items) {
          for (const video of videosData.items as VideoItem[]) {
            durationMap[video.id] = parseISODuration(video.contentDetails.duration);
            if (video.status.embeddable && video.status.privacyStatus === 'public') {
              embeddableSet.add(video.id);
            }
          }
        }
      } catch (batchErr) {
        console.error('Error fetching video batch:', batchErr);
        // Continue with remaining batches
      }
    }

    // 5. Map to Track format — only embeddable videos, sorted by position
    const sortedItems = [...validItems].sort(
      (a, b) => (a.snippet.position ?? 0) - (b.snippet.position ?? 0)
    );

    let skipped = 0;
    const tracks: Track[] = [];

    for (const item of sortedItems) {
      const videoId = item.snippet.resourceId.videoId;

      // Skip non-embeddable videos (but allow if we couldn't fetch status)
      if (embeddableSet.size > 0 && !embeddableSet.has(videoId)) {
        skipped++;
        continue;
      }

      const titleFull = item.snippet.title;
      const channel = item.snippet.videoOwnerChannelTitle || "Unknown Artist";

      let title = titleFull;
      let artist = channel.replace(" - Topic", "").replace("VEVO", "").trim();

      if (titleFull.includes(" - ")) {
        const parts = titleFull.split(" - ");
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }
      }

      tracks.push({
        id: `yt-${videoId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: title,
        artist: artist,
        film: "YouTube Import",
        year: new Date(item.snippet.publishedAt).getFullYear() || new Date().getFullYear(),
        duration: durationMap[videoId] || 0,
        videoId: videoId
      });
    }

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'No embeddable videos found in this playlist' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: playlistName,
      tracks,
      totalFetched: allItems.length,
      skipped
    });

  } catch (error: unknown) {
    console.error("YouTube Import Error:", error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
