
'use server';

import { revalidatePath } from 'next/cache';
import { readDb, writeDb } from '@/lib/db';

export async function deleteClients(clientIds: string[]) {
    try {
        const db = readDb();

        const initialUserCount = db.users.length;
        const initialClientCount = db.clients.length;

        // Filter out the clients and users to be deleted
        const updatedUsers = db.users.filter(user => !clientIds.includes(user.id));
        const updatedClients = db.clients.filter(client => !clientIds.includes(client.id));

        // Check if any change was made
        if (updatedUsers.length < initialUserCount || updatedClients.length < initialClientCount) {
             writeDb({ ...db, users: updatedUsers, clients: updatedClients });
        } else {
            // No clients found to delete, which could be an issue.
            return { success: false, error: "No matching clients found to delete." };
        }

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete clients:", error);
        return { success: false, error: "An unexpected error occurred during client deletion." };
    }
}
