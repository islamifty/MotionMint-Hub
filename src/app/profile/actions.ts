
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readDb, writeDb } from '@/lib/db';
import { getSession, createSession } from '@/lib/session';
import type { User } from '@/types';

const profileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty."),
  email: z.string().email(),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters long."),
});

export async function updateProfile(data: unknown) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const result = profileSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten().fieldErrors };
    }

    try {
        const db = readDb();
        const userIndex = db.users.findIndex(u => u.id === session.user.id);
        
        if (userIndex === -1) {
            return { success: false, error: "User not found." };
        }

        const updatedUser: User = { ...db.users[userIndex], name: result.data.name };
        db.users[userIndex] = updatedUser;
        
        // Also update client name if user is a client
        const clientIndex = db.clients.findIndex(c => c.id === session.user.id);
        if (clientIndex !== -1) {
            db.clients[clientIndex].name = result.data.name;
        }
        
        writeDb(db);
        
        // Update session
        await createSession(updatedUser);

        revalidatePath('/profile');
        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');
        return { success: true };

    } catch (e) {
        return { success: false, error: "An unexpected error occurred." };
    }
}


export async function changePassword(data: unknown) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const result = passwordSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten().fieldErrors };
    }
    
    const { currentPassword, newPassword } = result.data;

    try {
        const db = readDb();
        const user = db.users.find(u => u.id === session.user.id);

        if (!user) {
            return { success: false, error: "User not found." };
        }

        // In a real app, compare hashed passwords
        if (user.password !== currentPassword) {
            return { success: false, error: { currentPassword: ["Incorrect current password."] }};
        }

        user.password = newPassword;
        writeDb(db);

        return { success: true };
    } catch (e) {
         return { success: false, error: "An unexpected error occurred." };
    }
}
