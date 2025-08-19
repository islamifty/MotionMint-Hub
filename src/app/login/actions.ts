'use server';
import { createSession } from '@/lib/session';
import { readDb } from '@/lib/db';

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

    // Determine if the user is an admin based on their role property
    const isAdmin = user.role === 'admin';
    
    return { success: true, isAdmin };
}
