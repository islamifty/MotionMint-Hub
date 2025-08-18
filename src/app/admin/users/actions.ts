
'use server';

import { revalidatePath } from "next/cache";
import { getFirebaseAdmin, adminEmails } from '@/lib/firebase-admin';
import type { User, Client } from '@/types';
import { clients } from "@/lib/data";
import type { UserRecord } from "firebase-admin/auth";

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
        console.log("Permission denied: User is not an admin or not logged in.");
        return [];
    }
    
    try {
        const { auth, db } = getFirebaseAdmin();
        const userRecords = await auth.listUsers();
        
        const usersCollection = db.collection("users");
        const userDocsSnapshot = await usersCollection.get();
        const firestoreUsers = new Map(userDocsSnapshot.docs.map(doc => [doc.id, doc.data()]));

        const allUsers: User[] = userRecords.users.map((userRecord: UserRecord) => {
            const firestoreUser = firestoreUsers.get(userRecord.uid);
            return { 
                id: userRecord.uid,
                name: userRecord.displayName || firestoreUser?.name || userRecord.email || '',
                email: userRecord.email || '',
                role: firestoreUser?.role || 'user',
                initials: firestoreUser?.initials || (userRecord.displayName || userRecord.email || 'U').substring(0,2).toUpperCase(),
                avatarUrl: userRecord.photoURL || undefined
            };
        });
        
        return allUsers;
    } catch (error) {
        console.error("Error fetching users from server action: ", error);
        return [];
    }
}


export async function makeUserClient(user: User) {
    try {
        if (!user) {
            return { success: false, message: "User not found." };
        }
        
        const { db } = getFirebaseAdmin();
        const userRef = db.collection("users").doc(user.id);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            // If the user doc doesn't exist, create it. This can happen if a user was created in Auth but not Firestore.
            await userRef.set({
                name: user.name,
                email: user.email,
                initials: user.initials,
                role: 'client'
            });
        } else {
             const userData = userSnap.data();
             if (userData?.role === 'client' || userData?.role === 'admin') {
                return { success: false, message: "This user is already a client or an admin." };
             }
             await userRef.update({ role: 'client' });
        }

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
        return { success: false, message: "An unexpected error occurred. Check server logs and Firestore rules." };
    }
}
