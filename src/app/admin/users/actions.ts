'use server';

import { revalidatePath } from "next/cache";
import type { User } from '@/types';
import { promoteUserToClient } from "@/lib/api"; 
import { readDb, writeDb } from "@/lib/db";
import { adminEmails } from "@/lib/data";

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    const db = await readDb();
    return db.users;
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'client' | 'user') {
    try {
        const db = await readDb();
        const userToUpdate = db.users.find(u => u.id === userId);

        if (!userToUpdate) {
            return { success: false, message: "User not found." };
        }
        
        // Prevent changing the main admin's role
        if (adminEmails.includes(userToUpdate.email) && userToUpdate.email === adminEmails[0]) {
             return { success: false, message: "Cannot change the main administrator's role." };
        }

        userToUpdate.role = newRole;

        // If user is promoted to client, ensure they exist in clients list
        if (newRole === 'client' && !db.clients.some(c => c.id === userId)) {
            promoteUserToClient(userId, db); // Pass db to avoid re-reading
        }

        await writeDb(db);
        revalidatePath('/admin/users');
        return { success: true, message: `User role updated to ${newRole}.` };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}


export async function deleteUser(userId: string) {
    try {
        const db = await readDb();
        const userToDelete = db.users.find(u => u.id === userId);

        if (!userToDelete) {
            return { success: false, message: "User not found." };
        }
        
        // Prevent deleting the main admin
        if (adminEmails.includes(userToDelete.email) && userToDelete.email === adminEmails[0]) {
            return { success: false, message: "The main administrator cannot be deleted." };
        }
        
        // Filter out the user and their corresponding client entry
        db.users = db.users.filter(u => u.id !== userId);
        db.clients = db.clients.filter(c => c.id !== userId);
        
        await writeDb(db);
        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');
        return { success: true, message: "User and associated client profile have been deleted." };

    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
