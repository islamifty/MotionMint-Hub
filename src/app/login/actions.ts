
'use server';
import { createSession } from '@/lib/session';
import { readDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyPassword } from '@/lib/password';

export async function login(credentials: {email: string, password: string}) {
    const { email, password } = credentials;
    const db = await readDb();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
        logger.warn('Login failed: User not found', { email });
        return { success: false, error: "Invalid email or password." };
    }

    if (!user.password) {
        logger.error('Login failed: User has no password set', { email });
        return { success: false, error: "Invalid email or password." };
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
        logger.warn('Login failed: Invalid password', { email });
        return { success: false, error: "Invalid email or password." };
    }
    
    // Create session with a user object that doesn't include the password hash
    const { password: _, ...userToSession } = user;
    await createSession(userToSession);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Determine role from the user object property
    const isAdmin = user.role === 'admin';
    
    return { success: true, isAdmin };
}
