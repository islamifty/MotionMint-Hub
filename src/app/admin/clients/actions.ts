
'use server';

import { revalidatePath } from 'next/cache';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { clients } from '@/lib/data';

export async function deleteClients(clientIds: string[]) {
    try {
        const { auth, db } = getFirebaseAdmin();

        // Batch delete from Firebase Auth and Firestore
        const deleteAuthPromises = clientIds.map(id => auth.deleteUser(id).catch(err => console.error(`Failed to delete auth user ${id}:`, err)));
        const deleteFirestorePromises = clientIds.map(id => db.collection('users').doc(id).delete().catch(err => console.error(`Failed to delete firestore user ${id}:`, err)));
        
        await Promise.all([
            ...deleteAuthPromises,
            ...deleteFirestorePromises
        ]);
        
        // This simulates the data mutation for the demo's in-memory array
        const initialCount = clients.length;
        const newClients = clients.filter(c => !clientIds.includes(c.id));
        clients.length = 0;
        Array.prototype.push.apply(clients, newClients);
        
        if (clients.length !== initialCount - clientIds.length) {
            console.warn("In-memory client list did not update as expected.");
        }

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Failed to delete clients:", error);
        return { success: false, error: "An unexpected error occurred during client deletion." };
    }
}
