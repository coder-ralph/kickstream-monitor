import { NextRequest, NextResponse } from 'next/server';

interface KickChannel {
  id: number;
  slug: string;
  user: {
    id: number;
    username: string;
    profile_pic?: string;
  };
  livestream?: {
    id: number;
    session_title: string;
    is_live: boolean;
    viewer_count: number;
    created_at: string;
    categories?: Array<{ name: string }>;
  } | null;
  followers_count?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    // Use AllOrigins as a CORS proxy to bypass GambleGuard
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      `https://kick.com/api/v2/channels/${username}`
    )}`;

    console.log(`Fetching via proxy for: ${username}`);

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Streamer not found' },
          { status: 404 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const channel: KickChannel = await response.json();
    const livestream = channel.livestream;

    const streamData = {
      username: channel.user?.username || channel.slug,
      profilePic: channel.user?.profile_pic || 'https://kick.com/favicon.ico',
      isLive: livestream?.is_live || false,
      viewerCount: livestream?.viewer_count || 0,
      title: livestream?.session_title || 'No stream title',
      category: livestream?.categories?.[0]?.name || 'No category',
      startTime: livestream?.created_at || null,
      followersCount: channel.followers_count || 0,
      streamId: livestream?.id || null
    };

    return NextResponse.json(streamData);
  } catch (error: any) {
    console.error('Error fetching Kick data:', error.message);
    
    return NextResponse.json(
      { error: `Failed to fetch streamer data: ${error.message}` },
      { status: 500 }
    );
  }
}