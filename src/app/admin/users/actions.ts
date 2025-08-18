
'use server';

import { revalidatePath } from "next/cache";
import type { User } from '@/types';
import { promoteUserToClient, getAllUsers } from "@/lib/api"; 
import { users as allUsers, adminEmails } from "@/lib/data";

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
        console.log("Permission denied: User is not an admin or not logged in.");
        return [];
    }
    return getAllUsers();
}

export async function makeUserClient(user: User) {
    try {
        if (!user) {
            return { success: false, message: "User not found." };
        }

        const targetUser = allUsers.find(u => u.id === user.id);

        if (!targetUser) {
            return { success: false, message: "User not found in data store." };
        }
        
        if (targetUser.role === 'client' || targetUser.role === 'admin') {
            return { success: false, message: "This user is already a client or an admin." };
        }
        
        promoteUserToClient(user.id);

        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true, message: `${user.name} has been made a client.` };

    } catch (error) {
        console.error("Failed to make user a client:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
