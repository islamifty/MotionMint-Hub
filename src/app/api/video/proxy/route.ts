
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { readDb } from '@/lib/db';

// This function handles video proxy requests to hide the actual Nextcloud URL from the client.
// It works for both direct file paths and HLS playlist files (.m3u8) and segments (.ts).
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
    return new NextResponse('Missing video/file URL', { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(decodeURIComponent(videoUrl));
  } catch (error) {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // 3. Prepare the request to Nextcloud
  const db = readDb();
  const { nextcloudUser, nextcloudPassword } = db.settings;

  const headers = new Headers();
  
  const isShareLink = targetUrl.pathname.includes('/s/') || targetUrl.pathname.includes('/index.php/s/');
  
  if (!isShareLink && nextcloudUser && nextcloudPassword) {
    const credentials = Buffer.from(`${nextcloudUser}:${nextcloudPassword}`).toString('base64');
    headers.set('Authorization', `Basic ${credentials}`);
  }

  try {
    if (isShareLink && !targetUrl.pathname.endsWith('/download')) {
      targetUrl.pathname += '/download';
    }

    // 4. Fetch the video/file from Nextcloud from the server-side
    const resourceResponse = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: headers,
      redirect: 'follow',
    });

    if (!resourceResponse.ok) {
      console.error(`Nextcloud request failed with status: ${resourceResponse.status} ${resourceResponse.statusText}`);
      return new NextResponse(`Failed to fetch resource from source: ${resourceResponse.statusText}`, { status: resourceResponse.status });
    }
    
    // 5. Stream the content back to the client
    const readableStream = resourceResponse.body;
    
    if (!readableStream) {
        return new NextResponse('Resource stream not available', { status: 500 });
    }

    // Create a new response, streaming the body from the Nextcloud response
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', resourceResponse.headers.get('Content-Type') || 'application/octet-stream');
    const contentLength = resourceResponse.headers.get('Content-Length');
    if (contentLength) {
        responseHeaders.set('Content-Length', contentLength);
    }
    responseHeaders.set('Accept-Ranges', 'bytes');

    return new NextResponse(readableStream, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error proxying resource:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
