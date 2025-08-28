'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/turso';
import { clients, users } from '@/lib/schema';
import type { Client } from '@/types';
import { inArray } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';

export async function getClients(): Promise<Client[]> {
    noStore();
    return db.select().from(clients);
}

export async function deleteClients(clientIds: string[]) {
    try {
        await db.transaction(async (tx) => {
            await tx.delete(users).where(inArray(users.id, clientIds));
            await tx.delete(clients).where(inArray(clients.id, clientIds));
        });

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete clients:", error);
        return { success: false, error: "An unexpected error occurred during client deletion." };
    }
}
