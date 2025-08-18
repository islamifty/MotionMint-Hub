'use server';

import { revalidatePath } from "next/cache";
import type { User } from '@/types';
import { promoteUserToClient } from "@/lib/api"; 
import { readDb } from "@/lib/db";

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    // In a real app, you would add proper admin checks.
    // For now, we allow any logged-in user to see the list.
    const db = readDb();
    return db.users;
}

export async function makeUserClient(user: User) {
    try {
        if (!user) {
            return { success: false, message: "User not found." };
        }
        
        const success = promoteUserToClient(user.id);

        if (success) {
            revalidatePath('/admin/users');
            revalidatePath('/admin/clients');
            return { success: true, message: `${user.name} has been made a client.` };
        } else {
            return { success: false, message: "This user is already a client or an admin." };
        }

    } catch (error) {
        console.error("Failed to make user a client:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
