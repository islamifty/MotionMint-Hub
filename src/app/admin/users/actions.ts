
'use server';

import { revalidatePath } from "next/cache";
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { User, Client } from '@/types';
import { clients, mockUsers } from "@/lib/data";

const adminEmails = ["admin@motionflow.com", "mdiftekharulislamifty@gmail.com"];

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
        return [];
    }
    
    try {
        const { db } = getFirebaseAdmin();
        const usersCollection = db.collection("users");
        const userSnapshot = await usersCollection.get();
        const firestoreUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        // Combine mock users with Firestore users, giving precedence to Firestore data
        const combinedUsers = [...firestoreUsers];
        const firestoreUserEmails = new Set(firestoreUsers.map(u => u.email));

        for (const mockUser of mockUsers) {
            if (!firestoreUserEmails.has(mockUser.email)) {
                combinedUsers.push(mockUser);
            }
        }
        
        return combinedUsers;
    } catch (error) {
        console.error("Error fetching users from server action: ", error);
        // Return mock users if Firestore fails, ensuring the page still renders something.
        return mockUsers;
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
            // This case handles promoting a mock user who isn't in Firestore yet.
            const newUserFromMock: Omit<User, 'id'> = {
                name: user.name,
                email: user.email,
                role: 'client', // Promote directly
                initials: (user.name || user.email).substring(0, 2).toUpperCase(),
            };
            await userRef.set(newUserFromMock);
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
