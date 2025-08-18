
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { clients } from '@/lib/data';
import type { Client, User } from '@/types';

export async function makeUserClient(user: User) {
    try {
        if (!user) {
            return { success: false, message: "User not found." };
        }

        const existingClient = clients.find(c => c.email === user.email);
        if (existingClient) {
            return { success: false, message: "This user is already a client." };
        }
        
        // This part still uses the in-memory `clients` array for the demo.
        // In a full implementation, you would write to a 'clients' collection in Firestore.
        const newClient: Client = {
            id: `client-${Date.now()}`,
            name: user.name,
            email: user.email,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        // Update the user's role in Firestore
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
            role: 'client'
        });

        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true, message: `${user.name} has been made a client.` };

    } catch (error) {
        console.error("Failed to make user a client:", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}
