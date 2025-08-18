
'use server';

import { revalidatePath } from "next/cache";
import { db } from '@/lib/firebase-admin';
import type { User, Client } from '@/types';
import { clients } from "@/lib/data";

const adminEmails = ["admin@motionflow.com", "mdiftekharulislamifty@gmail.com"];

export async function getUsers(currentUserEmail?: string | null): Promise<User[]> {
    if (!currentUserEmail || !adminEmails.includes(currentUserEmail)) {
        return [];
    }
    
    try {
        const usersCollection = db.collection("users");
        const userSnapshot = await usersCollection.get();
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        return userList;
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
        
        const userRef = db.collection("users").doc(user.id);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return { success: false, message: "User profile does not exist in the database." };
        }

        const userData = userSnap.data();

        if (userData?.role === 'client' || userData?.role === 'admin') {
            return { success: false, message: "This user is already a client or an admin." };
        }

        const existingClient = clients.find(c => c.email === user.email);
        if (existingClient) {
             await userRef.update({
                role: 'client'
            });
            revalidatePath('/admin/users');
            return { success: true, message: `${user.name}'s role has been updated to client.` };
        }
        
        const newClient: Client = {
            id: user.id,
            name: user.name,
            email: user.email,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        await userRef.update({
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
