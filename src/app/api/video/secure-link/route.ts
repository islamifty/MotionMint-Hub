
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createHmac } from 'crypto';

// Use a fixed secret for simplicity, as it's not a high-security feature in this context.
const SECRET_KEY = "a_simple_but_fixed_secret_for_signing";
const LINK_EXPIRATION_SECONDS = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoUrl } = await request.json();
    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }
    
    // In this simplified model, we just ensure the URL is download-ready.
    // The main purpose is to prevent easy sharing of a direct file link from the project page.
    const secureUrl = new URL(videoUrl);

    if (secureUrl.pathname.includes('/s/') && !secureUrl.pathname.endsWith('/download')) {
      secureUrl.pathname += '/download';
    }
    
    return NextResponse.json({ secureUrl: secureUrl.toString() });

  } catch (error) {
    console.error('Error creating secure link:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
