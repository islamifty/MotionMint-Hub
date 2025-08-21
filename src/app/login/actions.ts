
'use server';
import { createSession } from '@/lib/session';
import { readDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyPassword } from '@/lib/password';

export async function login(credentials: {email: string, password: string}) {
    const { email, password } = credentials;

    try {
        const db = await readDb();
        const user = db.users.find((u) => u.email === email);

        if (!user) {
            logger.warn('Login failed: User not found', { email });
            return { success: false, error: "Invalid email or password." };
        }

        if (!user.password) {
            logger.error('Login failed: User has no password set', { email });
            return { success: false, error: "Account is not properly configured. Please contact support." };
        }

        const isPasswordValid = await verifyPassword(password, user.password);

        if (!isPasswordValid) {
            logger.warn('Login failed: Invalid password', { email });
            return { success: false, error: "Invalid email or password." };
        }
        
        // Create session with a user object that doesn't include the password hash
        const { password: _, ...userToSession } = user;
        await createSession({ user: userToSession });

        logger.info('User logged in successfully', { userId: user.id, email: user.email });
        
        // Determine redirect path based on role
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
        
        return { success: true, redirectPath };

    } catch (error) {
        logger.error('An unexpected error occurred during login', { error });
        return { success: false, error: "An unexpected server error occurred. Please try again later." };
    }
}
