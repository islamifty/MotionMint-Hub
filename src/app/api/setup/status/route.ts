import { NextResponse } from 'next/server';
import { isSetupCompleted } from '@/lib/db';

// Ensure this route is never cached
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setupComplete = await isSetupCompleted();
    return NextResponse.json({ setupCompleted: setupComplete });
  } catch (error) {
    console.error('Error checking setup status:', error);
    // In case of a DB error, assume setup is not complete to be safe.
    return NextResponse.json({ setupCompleted: false }, { status: 500 });
  }
}
