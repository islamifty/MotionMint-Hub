
'use server';

import { users, adminEmails } from "@/lib/data";
import type { User } from '@/types';
import { revalidatePath } from "next/cache";

export async function addNewUser(userData: { name: string, email: string, password: string }) {
    const isAdmin = adminEmails.includes(userData.email);

    if (users.some(u => u.email === userData.email)) {
        return { success: false, error: "An account with this email already exists." };
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: isAdmin ? "admin" : "user",
        initials: (userData.name || userData.email).substring(0,2).toUpperCase(),
        password: userData.password, // In a real app, you would hash this
    };
    
    try {
        users.unshift(newUser);
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Error adding user to mock data: ", error);
        return { success: false, error: "Failed to save user profile." };
    }
}
