
'use server';
import { createSession } from '@/lib/session';
import { readDb, writeDb } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';

// Bcrypt hashes can be identified by their prefix
const isBcryptHash = (str: string) => /^\$2[aby]?\$\d{2}\$/.test(str);

export async function login(credentials: {loginIdentifier: string, password: string}) {
    const { loginIdentifier, password } = credentials;

    try {
        const db = await readDb();
        
        // Find user by either email or phone
        const userIndex = db.users.findIndex((u) => u.email === loginIdentifier || u.phone === loginIdentifier);
        const user = userIndex !== -1 ? db.users[userIndex] : null;

        if (!user) {
            console.warn('Login failed: User not found', { loginIdentifier });
            return { success: false, error: "Invalid credentials." };
        }

        if (!user.password) {
            console.error('Login failed: User has no password set', { email: user.email });
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
                console.info('Plaintext password matched. Upgrading to hash.', { email: user.email });
                const newHashedPassword = await hashPassword(password);
                db.users[userIndex].password = newHashedPassword;
                await writeDb(db); // Asynchronously write the update
                console.info('Password successfully upgraded to hash.', { email: user.email });
            }
        }

        if (!isPasswordValid) {
            console.warn('Login failed: Invalid password', { email: user.email });
            return { success: false, error: "Invalid credentials." };
        }
        
        // Create session with a user object that doesn't include the password
        const { password: _, ...userToSession } = user;
        await createSession({ user: userToSession });

        console.info('User logged in successfully', { userId: user.id, email: user.email });
        
        // Determine redirect path based on role
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard';
        
        return { success: true, redirectPath };

    } catch (error) {
        console.error('An unexpected error occurred during login', { error });
        return { success: false, error: "An unexpected server error occurred. Please try again later." };
    }
}
