
'use server';

import { revalidatePath } from 'next/cache';
import { clients, users } from '@/lib/data';

export async function deleteClients(clientIds: string[]) {
    try {
        // Find indices of clients to delete
        const indicesToDelete = clientIds.map(id => clients.findIndex(c => c.id === id));
        
        // Remove from clients array by index to mutate the original array
        indicesToDelete
            .filter(index => index !== -1)
            .sort((a, b) => b - a) // Sort in descending order to avoid index shifting issues
            .forEach(index => clients.splice(index, 1));

        // Find indices of users to delete
        const userIndicesToDelete = clientIds.map(id => users.findIndex(u => u.id === id));

        // Remove from users array by index to mutate the original array
        userIndicesToDelete
            .filter(index => index !== -1)
            .sort((a, b) => b - a)
            .forEach(index => users.splice(index, 1));

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete clients:", error);
        return { success: false, error: "An unexpected error occurred during client deletion." };
    }
}
