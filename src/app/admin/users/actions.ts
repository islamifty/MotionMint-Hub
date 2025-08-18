
'use server';

import { revalidatePath } from 'next/cache';
import { clients, allUsers } from '@/lib/data';
import type { Client } from '@/types';

export async function makeUserClient(userId: string) {
    try {
        const user = allUsers.find(u => u.id === userId);

        if (!user) {
            return { success: false, message: "User not found." };
        }

        const existingClient = clients.find(c => c.email === user.email);
        if (existingClient) {
            return { success: false, message: "This user is already a client." };
        }

        const newClient: Client = {
            id: `client-${Date.now()}`,
            name: user.name,
            email: user.email,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        const userToUpdate = allUsers.find(u => u.id === userId);
        if (userToUpdate) {
            userToUpdate.role = 'client';
        }

        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true, message: `${user.name} has been made a client.` };

    } catch (error) {
        console.error("Failed to make user a client:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
