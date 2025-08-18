
'use server';

import { readDb, writeDb } from "@/lib/db";
import type { User, Client } from '@/types';
import { revalidatePath } from "next/cache";

export async function addNewUser(userData: { name: string, email: string, password: string }) {
    
    const db = readDb();

    if (db.users.some(u => u.email === userData.email)) {
        return { success: false, error: "An account with this email already exists." };
    }

    const newUserId = `user-${Date.now()}`;

    const newUser: User = {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        role: "client", // Automatically set role to client
        initials: (userData.name || userData.email).substring(0,2).toUpperCase(),
        password: userData.password, // In a real app, you would hash this
    };
    
    const newClient: Client = {
        id: newUserId,
        name: userData.name,
        email: userData.email,
        company: "",
        projectIds: [],
        createdAt: new Date().toISOString(),
    };

    try {
        db.users.unshift(newUser);
        db.clients.unshift(newClient);
        
        writeDb(db);
        
        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true };
    } catch (error) {
        console.error("Error adding user/client to mock data: ", error);
        return { success: false, error: "Failed to save user profile." };
    }
}
