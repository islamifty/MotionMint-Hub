
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { clients } from '@/lib/data';
import type { Client } from '@/types';

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required."),
  email: z.string().email("Please enter a valid email address."),
  company: z.string().optional(),
});

export async function addClient(data: unknown) {
    const result = clientSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }

    try {
        const newClient: Client = {
            id: `client-${Date.now()}`,
            name: result.data.name,
            email: result.data.email,
            company: result.data.company,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        revalidatePath('/admin/clients');

        return { success: true };

    } catch (error) {
        console.error("Client creation failed:", error);
        return { success: false, error: { formErrors: ["An unexpected error occurred."], fieldErrors: {} }};
    }
}
