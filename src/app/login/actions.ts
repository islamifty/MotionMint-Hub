
'use server';
import { createSession } from '@/lib/session';
import { readDb, writeDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { hashPassword, verifyPassword } from '@/lib/password';

// Bcrypt hashes can be identified by their prefix
const isBcryptHash = (str: string) => /^\$2[aby]?\$\d{2}\$/.test(str);

export async function login(credentials: {email: string, password: string}) {
    const { email, password } = credentials;

    try {
        const db = await readDb();
        const userIndex = db.users.findIndex((u) => u.email === email);
        const user = userIndex !== -1 ? db.users[userIndex] : null;

        if (!user) {
            logger.warn('Login failed: User not found', { email });
            return { success: false, error: "Invalid email or password." };
        }

        if (!user.password) {
            logger.error('Login failed: User has no password set', { email });
            return { success: false, error: "Account is not properly configured. Please contact support." };
        }
        
        let isPasswordValid = false;
        
        // Check if the stored password is a hash or plaintext
        if (isBcryptHash(user.password)) {
            // It's a hash, use bcrypt to compare
            isPasswordValid = await verifyPassword(password, user.password);
        } else {
            // It's plaintext, compare directly
            isPasswordValid = user.password === password;
            
            // If plaintext password is valid, hash and update it in the database
            if (isPasswordValid) {
                logger.info('Plaintext password matched. Upgrading to hash.', { email });
                const newHashedPassword = await hashPassword(password);
                db.users[userIndex].password = newHashedPassword;
                await writeDb(db); // Asynchronously write the update
                logger.info('Password successfully upgraded to hash.', { email });
            }
        }

        if (!isPasswordValid) {
            logger.warn('Login failed: Invalid password', { email });
            return { success: false, error: "Invalid email or password." };
        }
        
        // Create session with a user object that doesn't include the password
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
