
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readDb, writeDb } from '@/lib/db';
import { getSession, createSession } from '@/lib/session';
import { verifyPassword, hashPassword } from '@/lib/password';
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
        const db = await readDb();
        const userIndex = db.users.findIndex(u => u.id === session.user.id);
        
        if (userIndex === -1) {
            return { success: false, error: "User not found." };
        }

        const userFromDb = db.users[userIndex];
        const updatedUser: User = { ...userFromDb, name: result.data.name };
        db.users[userIndex] = updatedUser;
        
        // Also update client name if user is a client
        const clientIndex = db.clients.findIndex(c => c.id === session.user.id);
        if (clientIndex !== -1) {
            db.clients[clientIndex].name = result.data.name;
        }
        
        await writeDb(db);
        
        // Update session, ensuring password is not included
        const { password, ...userForSession } = updatedUser;
        await createSession({ user: userForSession });

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
        const db = await readDb();
        const user = db.users.find(u => u.id === session.user.id);

        if (!user || !user.password) {
            return { success: false, error: "User not found or has no password set." };
        }
        
        // Since the DB might have plaintext passwords, we handle both cases.
        const isBcryptHash = (str: string) => /^\$2[aby]?\$\d{2}\$/.test(str);
        
        let isPasswordValid = false;
        if (isBcryptHash(user.password)) {
            isPasswordValid = await verifyPassword(currentPassword, user.password);
        } else {
            isPasswordValid = user.password === currentPassword;
        }

        if (!isPasswordValid) {
            return { success: false, error: { currentPassword: ["Incorrect current password."] }};
        }

        user.password = await hashPassword(newPassword);
        await writeDb(db);

        return { success: true };
    } catch (e) {
         return { success: false, error: "An unexpected error occurred." };
    }
}
