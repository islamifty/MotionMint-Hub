import { NextResponse } from 'next/server';
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function checkSetupStatus(): Promise<boolean> {
  try {
    // Check if the 'users' table exists and has an admin.
    const adminUser = await db.select({ id: users.id }).from(users).where(sql`${users.role} = 'admin'`).limit(1);
    return adminUser.length > 0;
  } catch (error: any) {
    // This will catch errors if the table doesn't exist yet.
    if (error.message?.includes('no such table') || error.message?.includes('NOT_FOUND')) {
      return false;
    }
    // Log other unexpected errors but return false to be safe.
    console.error("Error checking setup status in API route:", error);
    return false;
  }
}

export async function GET() {
  const setupCompleted = await checkSetupStatus();
  return NextResponse.json({ setupCompleted });
}
