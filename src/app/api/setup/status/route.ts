import { NextResponse } from 'next/server';
import { db } from '@/lib/turso';
import { sql } from 'drizzle-orm';

// Ensure this route is never cached
export const dynamic = 'force-dynamic';

async function isSetupComplete(): Promise<boolean> {
  try {
    const result: { name: string }[] = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users';`);
    if (result.length === 0) return false;

    const adminResult: { count: number }[] = await db.run(sql`SELECT count(*) as count FROM users WHERE role = 'admin'`);
    return adminResult[0].count > 0;

  } catch (error) {
    console.error('Error checking setup status in API route:', error);
    return false;
  }
}

export async function GET() {
  try {
    const setupComplete = await isSetupComplete();
    return NextResponse.json({ setupCompleted: setupComplete });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json({ setupCompleted: false }, { status: 500 });
  }
}
