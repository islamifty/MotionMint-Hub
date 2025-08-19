'use server';
import { createSession } from '@/lib/session';
import { readDb } from '@/lib/db';
import { adminEmails } from '@/lib/data';

export async function login(credentials: {email: string, password: string}) {
    const { email, password } = credentials;
    const db = readDb();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
        return { success: false, error: "Invalid email or password." };
    }

    // In a real app, you would compare a hashed password.
    // For this demo, we'll use a plain text comparison.
    if (user.password !== password) {
        return { success: false, error: "Invalid email or password." };
    }
    
    await createSession(user);

    const isAdmin = adminEmails.includes(user.email);
    
    return { success: true, isAdmin };
}
