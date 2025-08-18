
'use server';

import { revalidatePath } from 'next/cache';
import { clients, users } from '@/lib/data';

export async function deleteClients(clientIds: string[]) {
    try {
        // This simulates the data mutation for the demo's in-memory array
        const initialClientsCount = clients.length;
        const initialUsersCount = users.length;
        
        const newClients = clients.filter(c => !clientIds.includes(c.id));
        const newUsers = users.filter(u => !clientIds.includes(u.id));

        // This is a way to mutate the in-memory array for the demo
        clients.length = 0;
        Array.prototype.push.apply(clients, newClients);

        users.length = 0;
        Array.prototype.push.apply(users, newUsers);
        
        if (clients.length !== initialClientsCount - clientIds.length) {
            console.warn("In-memory client list did not update as expected.");
        }
        if (users.length !== initialUsersCount - clientIds.length) {
            console.warn("In-memory user list did not update as expected.");
        }

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete clients:", error);
        return { success: false, error: "An unexpected error occurred during client deletion." };
    }
}
