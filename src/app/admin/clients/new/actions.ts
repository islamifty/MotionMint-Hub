'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/turso';
import { users, clients } from '@/lib/schema';
import type { Client, User } from '@/types';
import { hashPassword } from '@/lib/password';
import { eq } from 'drizzle-orm';

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  phone: z.string().min(1, "Phone number is required."),
  company: z.string().optional(),
});

export async function addClient(data: unknown) {
    const result = clientSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }

    try {
        const { name, email, password, phone, company } = result.data;
        
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUser.length > 0) {
            return { success: false, error: { formErrors: ["This email address is already in use."], fieldErrors: {} }};
        }

        const newUserId = `user-${Date.now()}`;
        const hashedPassword = await hashPassword(password);

        const newUser: Omit<User, 'notificationSettings'> = {
            id: newUserId,
            name: name,
            email: email,
            phone: phone,
            role: 'client',
            initials: (name || email).substring(0, 2).toUpperCase(),
            password: hashedPassword,
        };
        
        const newClient: Client = {
            id: newUserId,
            name: name,
            email: email,
            phone: phone,
            company: company,
            projectIds: [], // This field is deprecated with SQL
            createdAt: new Date().toISOString(),
        };

        await db.transaction(async (tx) => {
            await tx.insert(users).values(newUser as any);
            await tx.insert(clients).values(newClient as any);
        });
        
        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };

    } catch (error: any) {
        console.error("Client creation failed:", error);
        let errorMessage = "An unexpected error occurred.";
        return { success: false, error: { formErrors: [errorMessage], fieldErrors: {} }};
    }
}
