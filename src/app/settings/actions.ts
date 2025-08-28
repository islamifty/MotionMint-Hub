'use server';

import { getSession } from '@/lib/session';
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function getNotificationSettings() {
    noStore();
    const session = await getSession();
    if (!session?.user) {
        return null;
    }
    const userResult = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    const user = userResult[0];

    return user ? { newProject: user.newProjectNotifications, paymentSuccess: user.paymentSuccessNotifications } : { newProject: true, paymentSuccess: true };
}


export async function updateNotificationSettings(settings: { newProject: boolean; paymentSuccess: boolean; }) {
     const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const userResult = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
        
        if (userResult.length === 0) {
            return { success: false, error: "User not found." };
        }

        await db.update(users).set({
            newProjectNotifications: settings.newProject,
            paymentSuccessNotifications: settings.paymentSuccess,
        }).where(eq(users.id, session.user.id));
        
        return { success: true };
    } catch(e) {
         return { success: false, error: "An unexpected error occurred." };
    }
}
