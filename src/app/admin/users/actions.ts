
'use server';

import { revalidatePath } from "next/cache";
import type { User, Client } from '@/types';
import { clients, users, adminEmails } from "@/lib/data";

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
        console.log("Permission denied: User is not an admin or not logged in.");
        return [];
    }
    
    // In a real app, you would fetch from a database. Here we return the mock data.
    return Promise.resolve(users);
}


export async function makeUserClient(user: User) {
    try {
        if (!user) {
            return { success: false, message: "User not found." };
        }
        
        const targetUser = users.find(u => u.id === user.id);

        if (!targetUser) {
             return { success: false, message: "User not found in data store." };
        }
        
        if (targetUser.role === 'client' || targetUser.role === 'admin') {
            return { success: false, message: "This user is already a client or an admin." };
        }
        
        // Update user role
        targetUser.role = 'client';

        const existingClient = clients.find(c => c.email === user.email);
        if (!existingClient) {
            const newClient: Client = {
                id: user.id,
                name: user.name,
                email: user.email,
                projectIds: [],
                createdAt: new Date().toISOString(),
            };
            clients.unshift(newClient);
        }

        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true, message: `${user.name} has been made a client.` };

    } catch (error) {
        console.error("Failed to make user a client:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
