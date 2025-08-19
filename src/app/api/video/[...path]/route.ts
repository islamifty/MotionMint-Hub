
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import { readDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 1. Authenticate the user
  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Get Nextcloud credentials from the database
  const db = readDb();
  const { nextcloudUrl, nextcloudUser, nextcloudPassword } = db.settings;

  if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
    return new NextResponse('Nextcloud not configured', { status: 500 });
  }

  // 3. Reconstruct the actual Nextcloud file URL from the request path
  const requestPath = params.path.join('/');
  
  // Get the base URL (e.g., https://mydrive.motionmint.top)
  const urlObject = new URL(nextcloudUrl);
  const nextcloudBaseUrl = `${urlObject.protocol}//${urlObject.host}`;

  let finalFileUrl = `${nextcloudBaseUrl}/${requestPath}`;

  // If it's a share link, append /download to get the direct file
  if (requestPath.includes('/s/') || requestPath.includes('/index.php/s/')) {
    if (!finalFileUrl.endsWith('/download')) {
      finalFileUrl += '/download';
    }
  }


  // 4. Fetch the video from Nextcloud using credentials
  try {
    const response = await fetch(finalFileUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${nextcloudUser}:${nextcloudPassword}`).toString('base64')}`
      },
    });

    if (!response.ok || !response.body) {
      console.error(`Failed to fetch from Nextcloud: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Nextcloud error body:', errorBody);
      return new NextResponse(`Failed to fetch video from storage: ${response.statusText}`, { status: response.status });
    }
    
    // 5. Stream the video back to the client
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Length', response.headers.get('Content-Length') || '');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');


    // Return a streaming response
    return new NextResponse(response.body, {
      status: response.status, // Use the original status (e.g., 206 for partial content)
      headers: headers
    });

  } catch (error) {
    console.error('Error proxying video:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
