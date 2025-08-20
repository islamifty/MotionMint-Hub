
'use server';

import { z } from 'zod';
import { readDb } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { encrypt } from '@/lib/session'; 
import { logger } from '@/lib/logger';

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

// In a real app, you'd store this token in the DB with an expiry
async function generatePasswordResetToken(userId: string) {
    const payload = { userId, purpose: 'password-reset' };
    const token = await encrypt(payload);
    return token;
}

export async function sendPasswordResetLink(data: unknown) {
    const result = emailSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: "Invalid email address." };
    }

    const { email } = result.data;

    try {
        const db = await readDb();
        const user = db.users.find(u => u.email === email);

        if (!user) {
            // Don't reveal if a user exists or not for security reasons
            logger.warn(`Password reset requested for non-existent user: ${email}`);
            return { success: true };
        }

        const token = await generatePasswordResetToken(user.id);
        const appUrl = process.env.APP_URL || 'http://localhost:9000';
        const resetLink = `${appUrl}/reset-password?token=${token}`;
        
        await sendEmail({
            to: user.email,
            subject: 'Reset Your Password',
            html: `
                <h1>Password Reset Request</h1>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset. Click the link below to set a new password:</p>
                <a href="${resetLink}">Reset Password</a>
                <p>This link will expire in 1 day.</p>
                <p>If you did not request this, please ignore this email.</p>
            `,
        });

        logger.info(`Password reset link sent to ${email}`);
        return { success: true };

    } catch (error: any) {
        logger.error("Failed to send password reset email:", { error: error.message, email });
        // Return success to avoid leaking information about email sending capabilities
        return { success: true };
    }
}
