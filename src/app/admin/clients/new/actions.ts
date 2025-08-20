'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readDb, writeDb } from '@/lib/db';
import type { Client, User } from '@/types';

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
        const db = await readDb();

        // Check if user already exists
        if (db.users.some(u => u.email === email)) {
            return { success: false, error: { formErrors: ["This email address is already in use."], fieldErrors: {} }};
        }

        const newUserId = `user-${Date.now()}`;

        // 1. Create user
        const newUser: User = {
            id: newUserId,
            name: name,
            email: email,
            phone: phone,
            role: 'client',
            initials: (name || email).substring(0, 2).toUpperCase(),
            password: password, // In a real app, hash this password
        };
        db.users.unshift(newUser);
        
        // 2. Add to clients list
        const newClient: Client = {
            id: newUserId,
            name: name,
            email: email,
            phone: phone,
            company: company,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };
        db.clients.unshift(newClient);

        // Write the updated data back to the file
        await writeDb(db);

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };

    } catch (error: any) {
        console.error("Client creation failed:", error);
        let errorMessage = "An unexpected error occurred.";
        return { success: false, error: { formErrors: [errorMessage], fieldErrors: {} }};
    }
}
