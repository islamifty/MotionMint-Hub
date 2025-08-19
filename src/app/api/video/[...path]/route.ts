
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

  // 3. Construct the actual Nextcloud file URL from the request path
  // The client will send the path starting from 'remote.php' or 's'
  const filePath = params.path.join('/');
  
  // Get the base URL (e.g., https://mydrive.motionmint.top)
  const urlObject = new URL(nextcloudUrl);
  const nextcloudBaseUrl = `${urlObject.protocol}//${urlObject.host}`;

  // The final URL is the base URL plus the path sent by the client.
  // Example filePath: 'remote.php/dav/files/user/video.mp4' or 'index.php/s/sharelink/download'
  const fileUrl = `${nextcloudBaseUrl}/${filePath}`;

  // 4. Fetch the video from Nextcloud using credentials
  try {
    const response = await fetch(fileUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${nextcloudUser}:${nextcloudPassword}`).toString('base64')}`
      },
      cache: 'no-store' // Ensure we're not caching the video on our server
    });

    if (!response.ok) {
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
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');


    // Return a streaming response
    return new NextResponse(response.body, {
      status: 200,
      headers: headers
    });

  } catch (error) {
    console.error('Error proxying video:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

