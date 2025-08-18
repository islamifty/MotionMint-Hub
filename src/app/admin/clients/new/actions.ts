
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { clients, users } from '@/lib/data';
import type { Client, User } from '@/types';

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  company: z.string().optional(),
});

export async function addClient(data: unknown) {
    const result = clientSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }

    try {
        const { name, email, password, company } = result.data;

        // Check if user already exists
        if (users.some(u => u.email === email)) {
            return { success: false, error: { formErrors: ["This email address is already in use."], fieldErrors: {} }};
        }

        const newUserId = `user-${Date.now()}`;

        // 1. Create user in the local user list
        const newUser: User = {
            id: newUserId,
            name: name,
            email: email,
            role: 'client',
            initials: (name || email).substring(0, 2).toUpperCase(),
            password: password, // In a real app, hash this password
        };
        users.unshift(newUser);
        
        // 2. Add to the local clients list
        const newClient: Client = {
            id: newUserId,
            name: name,
            email: email,
            company: company,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };

    } catch (error: any) {
        console.error("Client creation failed:", error);
        let errorMessage = "An unexpected error occurred.";
        return { success: false, error: { formErrors: [errorMessage], fieldErrors: {} }};
    }
}
