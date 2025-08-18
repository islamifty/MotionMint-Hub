
'use server';

import { doc, setDoc } from "firebase/firestore"; 
import { db } from '@/lib/firebase';
import type { User } from '@/types';
import { revalidatePath } from "next/cache";

// This function now runs in a 'use server' context.
// It creates a new user document in Firestore upon successful registration.
export async function addNewUser(userData: {id: string, name: string, email: string}) {
    // A user's role is 'user' by default. Admins are hardcoded for this demo.
    const newUser: Omit<User, 'id'> = {
        name: userData.name,
        email: userData.email,
        role: "user",
        initials: (userData.name || userData.email).substring(0,2).toUpperCase(),
    };
    
    try {
        // Use the user's UID as the document ID in Firestore for easy lookups.
        await setDoc(doc(db, "users", userData.id), newUser);
        
        // Invalidate the cache for the admin users page
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error) {
        console.error("Error adding user to Firestore: ", error);
        return { success: false, error: "Failed to save user profile." };
    }
}
