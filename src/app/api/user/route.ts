import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  if (session?.user) {
    return NextResponse.json({ user: session.user });
  }
  // Return 200 with user: null for unauthenticated requests
  // This prevents log warnings from automated probes (like Google's)
  // while still correctly indicating no user is logged in.
  return NextResponse.json({ user: null }, { status: 200 });
}
