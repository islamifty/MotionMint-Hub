
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { readDb } from '@/lib/db';

// This function handles video proxy requests to hide the actual Nextcloud URL from the client.
export async function GET(request: NextRequest) {
  // 1. Authenticate the user
  const session = await getSession();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Get the target video URL from the query string
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');

  if (!videoUrl) {
    return new NextResponse('Missing video URL', { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(decodeURIComponent(videoUrl));
  } catch (error) {
    return new NextResponse('Invalid video URL', { status: 400 });
  }

  // 3. Prepare the request to Nextcloud
  const db = readDb();
  const { nextcloudUser, nextcloudPassword } = db.settings;

  const headers = new Headers();
  
  // Add authentication only if it's a direct file path and credentials exist
  const isShareLink = targetUrl.pathname.includes('/s/') || targetUrl.pathname.includes('/index.php/s/');
  
  if (!isShareLink && nextcloudUser && nextcloudPassword) {
    const credentials = Buffer.from(`${nextcloudUser}:${nextcloudPassword}`).toString('base64');
    headers.set('Authorization', `Basic ${credentials}`);
  }

  try {
    // If it's a share link, ensure it points to the download endpoint for direct file access
    if (isShareLink && !targetUrl.pathname.endsWith('/download')) {
      targetUrl.pathname += '/download';
    }

    // 4. Fetch the video from Nextcloud from the server-side
    const videoResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: headers,
      redirect: 'follow', // Important for Nextcloud redirects
    });

    if (!videoResponse.ok) {
      console.error(`Nextcloud request failed with status: ${videoResponse.status} ${videoResponse.statusText}`);
      return new NextResponse(`Failed to fetch video from source: ${videoResponse.statusText}`, { status: videoResponse.status });
    }
    
    // 5. Stream the video back to the client
    const readableStream = videoResponse.body;
    
    if (!readableStream) {
        return new NextResponse('Video stream not available', { status: 500 });
    }

    // Create a new response, streaming the body from the Nextcloud response
    return new NextResponse(readableStream, {
      status: 200,
      headers: {
        'Content-Type': videoResponse.headers.get('Content-Type') || 'video/mp4',
        'Content-Length': videoResponse.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('Error proxying video:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
