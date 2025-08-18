'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { clients } from '@/lib/data';
import type { Client } from '@/types';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const clientSchema = z.object({
  name: z.string().min(1, "Client name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  company: z.string().optional(),
});

export async function addClient(data: unknown) {
    const result = clientSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }

    try {
        const { auth, db } = getFirebaseAdmin();
        const { name, email, password, company } = result.data;

        // 1. Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: name,
        });

        // 2. Create user profile in Firestore
        await db.collection("users").doc(userRecord.uid).set({
            name: name,
            email: email,
            role: 'client',
            initials: (name || email).substring(0, 2).toUpperCase(),
        });
        
        // 3. Add to the local clients list (for demo purposes)
        const newClient: Client = {
            id: userRecord.uid,
            name: name,
            email: email,
            company: company,
            projectIds: [],
            createdAt: new Date().toISOString(),
        };

        clients.unshift(newClient);

        revalidatePath('/admin/clients');
        revalidatePath('/admin/users');

        return { success: true };

    } catch (error: any) {
        console.error("Client creation failed:", error);
        let errorMessage = "An unexpected error occurred.";
        if (error.code === 'auth/email-already-exists') {
            errorMessage = "This email address is already in use by another account.";
        }
        return { success: false, error: { formErrors: [errorMessage], fieldErrors: {} }};
    }
}
