
'use server';
import { createSession } from '@/lib/session';
import { readDb } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function login(credentials: {email: string, password: string}) {
    const { email, password } = credentials;
    const db = await readDb();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
        logger.warn('Login failed: User not found', { email });
        return { success: false, error: "Invalid email or password." };
    }

    // In a real app, you would compare a hashed password.
    // For this demo, we'll use a plain text comparison.
    if (user.password !== password) {
        logger.warn('Login failed: Invalid password', { email });
        return { success: false, error: "Invalid email or password." };
    }
    
    await createSession(user);
    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Determine role from the user object property
    const isAdmin = user.role === 'admin';
    
    return { success: true, isAdmin };
}
