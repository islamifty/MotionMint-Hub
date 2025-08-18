
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { clients } from '@/lib/data';
import type { Client, User } from '@/types';

export async function makeUserClient(user: User) {
    try {
        if (!user) {
            return { success: false, message: "User not found." };
        }
        
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { success: false, message: "User profile does not exist in the database." };
        }

        const userData = userSnap.data();

        if (userData.role === 'client' || userData.role === 'admin') {
            return { success: false, message: "This user is already a client or an admin." };
        }

        const existingClient = clients.find(c => c.email === user.email);
        if (existingClient) {
            // If they are already in the mock client list, just update their role in Firestore
             await updateDoc(userRef, {
                role: 'client'
            });
            revalidatePath('/admin/users');
            return { success: true, message: `${user.name}'s role has been updated to client.` };
        }
        
        const newClient: Client = {
            id: user.id, // Use the user's auth UID as the client ID for consistency
            name: user.name,
            email: user.email,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        // Update the user's role in Firestore
        await updateDoc(userRef, {
            role: 'client'
        });

        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true, message: `${user.name} has been made a client.` };

    } catch (error) {
        console.error("Failed to make user a client:", error);
        return { success: false, message: "An unexpected error occurred. Check server logs and Firestore rules." };
    }
}
