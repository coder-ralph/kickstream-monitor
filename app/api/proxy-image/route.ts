import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Image URL is required' },
      { status: 400 }
    );
  }

  try {
    console.log('Proxying image:', imageUrl);

    // Use allorigins proxy for images too
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status}`);
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    
    // Try to get content type from original URL or default to image/jpeg
    let contentType = 'image/jpeg';
    if (imageUrl.endsWith('.png')) contentType = 'image/png';
    if (imageUrl.endsWith('.gif')) contentType = 'image/gif';
    if (imageUrl.endsWith('.webp')) contentType = 'image/webp';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error proxying image:', error.message);
    
    // Return 404 to trigger the onError fallback in the component
    return new NextResponse(null, { status: 404 });
  }
}