
'use server';

import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { User, Client } from '@/types';
import { clients } from "@/lib/data";

const adminEmails = ["admin@motionflow.com", "mdiftekharulislamifty@gmail.com"];

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
        return [];
    }
    
    try {
        const { db } = getFirebaseAdmin();
        const usersCollection = db.collection("users");
        const userSnapshot = await usersCollection.get();
        const firestoreUsers = userSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id,
                name: data.name || '',
                email: data.email || '',
                role: data.role || 'user',
                initials: data.initials || ''
            } as User;
        });
        
        return firestoreUsers;
    } catch (error) {
        console.error("Error fetching users from server action: ", error);
        // If Firestore fails, return an empty array to prevent a crash.
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
            return { success: false, message: "User does not exist in the database." };
        } 
        
        const userData = userSnap.data();
        if (userData?.role === 'client' || userData?.role === 'admin') {
            return { success: false, message: "This user is already a client or an admin." };
        }
        await userRef.update({ role: 'client' });


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
