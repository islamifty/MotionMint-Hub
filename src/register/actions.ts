
'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { User } from '@/types';
import { revalidatePath } from "next/cache";

export async function addNewUser(userData: {id: string, name: string, email: string}) {
    const newUser: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        role: "user",
        initials: (userData.name || userData.email).substring(0,2).toUpperCase(),
    };
    
    try {
        const { db } = getFirebaseAdmin();
        await db.collection("users").doc(userData.id).set(newUser);
        
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Error adding user to Firestore: ", error);
        return { success: false, error: "Failed to save user profile." };
    }
}
