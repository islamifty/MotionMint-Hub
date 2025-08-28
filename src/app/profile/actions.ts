'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/turso';
import { users, clients } from '@/lib/schema';
import { eq } from 'drizzle-orm';
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
        const userResult = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
        if (userResult.length === 0) {
            return { success: false, error: "User not found." };
        }
        const userFromDb = userResult[0];

        await db.update(users).set({ name: result.data.name }).where(eq(users.id, session.user.id));
        
        const clientResult = await db.select().from(clients).where(eq(clients.id, session.user.id)).limit(1);
        if (clientResult.length > 0) {
            await db.update(clients).set({ name: result.data.name }).where(eq(clients.id, session.user.id));
        }
        
        const updatedUser: User = { ...userFromDb, name: result.data.name };
        
        const { password, ...userForSession } = updatedUser;
        await createSession({ user: userForSession as any });

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
        const userResult = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
        const user = userResult[0];

        if (!user || !user.password) {
            return { success: false, error: "User not found or has no password set." };
        }
        
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

        const newHashedPassword = await hashPassword(newPassword);
        await db.update(users).set({ password: newHashedPassword }).where(eq(users.id, session.user.id));

        return { success: true };
    } catch (e) {
         return { success: false, error: "An unexpected error occurred." };
    }
}
