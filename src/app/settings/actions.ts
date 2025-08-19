
'use server';

import { readDb, writeDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function getNotificationSettings() {
    const session = await getSession();
    if (!session?.user) {
        return null;
    }
    const db = readDb();
    const user = db.users.find(u => u.id === session.user.id);
    return user?.notificationSettings || { newProject: true, paymentSuccess: true };
}


export async function updateNotificationSettings(settings: { newProject: boolean; paymentSuccess: boolean; }) {
     const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const db = readDb();
        const userIndex = db.users.findIndex(u => u.id === session.user.id);
        
        if (userIndex === -1) {
            return { success: false, error: "User not found." };
        }

        db.users[userIndex].notificationSettings = settings;
        writeDb(db);
        
        return { success: true };
    } catch(e) {
         return { success: false, error: "An unexpected error occurred." };
    }
}
