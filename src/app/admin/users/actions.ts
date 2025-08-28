'use server';

import { revalidatePath } from "next/cache";
import { db } from '@/lib/turso';
import { users, clients } from '@/lib/schema';
import { eq, inArray } from "drizzle-orm";
import type { User } from '@/types';
import { promoteUserToClient } from "@/lib/api"; 
import { adminEmails } from "@/lib/data";
import { unstable_noStore as noStore } from 'next/cache';

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    noStore();
    const userResults = await db.select().from(users);
    return userResults as User[];
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'client' | 'user') {
    try {
        const userToUpdateResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const userToUpdate = userToUpdateResult[0];

        if (!userToUpdate) {
            return { success: false, message: "User not found." };
        }
        
        if (adminEmails.includes(userToUpdate.email) && userToUpdate.email === adminEmails[0]) {
             return { success: false, message: "Cannot change the main administrator's role." };
        }
        
        await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

        if (newRole === 'client') {
            const clientExists = await db.select().from(clients).where(eq(clients.id, userId)).limit(1);
            if (clientExists.length === 0) {
                await promoteUserToClient(userId);
            }
        }

        revalidatePath('/admin/users');
        return { success: true, message: `User role updated to ${newRole}.` };
    } catch (error) {
        console.error("Failed to update user role:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}


export async function deleteUser(userId: string) {
    try {
        const userToDeleteResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const userToDelete = userToDeleteResult[0];

        if (!userToDelete) {
            return { success: false, message: "User not found." };
        }
        
        if (adminEmails.includes(userToDelete.email) && userToDelete.email === adminEmails[0]) {
            return { success: false, message: "The main administrator cannot be deleted." };
        }
        
        await db.transaction(async (tx) => {
            await tx.delete(users).where(eq(users.id, userId));
            await tx.delete(clients).where(eq(clients.id, userId));
        });
        
        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');
        return { success: true, message: "User and associated client profile have been deleted." };

    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
