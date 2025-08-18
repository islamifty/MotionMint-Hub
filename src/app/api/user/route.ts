import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  if (session?.user) {
    return NextResponse.json({ user: session.user });
  }
  return NextResponse.json({ user: null }, { status: 401 });
}
