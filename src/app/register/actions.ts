
'use server';

import { revalidatePath } from 'next/cache';
import { doc, setDoc } from "firebase/firestore"; 
import { db } from '@/lib/firebase';
import type { User } from '@/types';

export async function addNewUser(userData: {id: string, name: string, email: string}) {
    const newUser: User = {
        ...userData,
        role: "user",
        initials: (userData.name || userData.email).substring(0,2).toUpperCase(),
    };
    
    try {
        // Use the user's UID as the document ID in Firestore
        await setDoc(doc(db, "users", newUser.id), {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            initials: newUser.initials,
        });
        
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Error adding user to Firestore: ", error);
        return { success: false, error: "Failed to save user profile." };
    }
}
