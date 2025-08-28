'use server';

import { z } from 'zod';
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { or, eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { encrypt } from '@/lib/session'; 
import { getBaseUrl } from '@/lib/url';

const resetSchema = z.object({
  identifier: z.string().min(1, "Please enter your email or phone number."),
});

// In a real app, you'd store this token in the DB with an expiry
async function generatePasswordResetToken(userId: string) {
    const payload = { userId, purpose: 'password-reset' };
    const token = await encrypt(payload);
    return token;
}

export async function sendPasswordResetNotification(data: unknown) {
    const result = resetSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: "Invalid input." };
    }

    const { identifier } = result.data;
    const isEmail = identifier.includes('@');

    try {
        const userResult = await db.select().from(users).where(or(eq(users.email, identifier), eq(users.phone, identifier))).limit(1);
        const user = userResult[0];

        if (!user) {
            // Don't reveal if a user exists or not for security reasons
            console.warn(`Password reset requested for non-existent account: ${identifier}`);
            return { success: true };
        }

        const token = await generatePasswordResetToken(user.id);
        const appUrl = getBaseUrl();
        const resetLink = `${appUrl}/reset-password?token=${token}`;
        
        if (isEmail) {
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
            console.info(`Password reset link sent to ${user.email}`);
        } else if (user.phone) {
            // For phone, sending a link via SMS is often better than OTP for this flow
             await sendSms({
                to: user.phone,
                message: `Hello ${user.name}, to reset your password, please visit this link: ${resetLink}`,
            });
            console.info(`Password reset link sent to ${user.phone}`);
        }

        return { success: true };

    } catch (error: any) {
        console.error("Failed to send password reset notification:", { error: error.message, identifier });
        // Return success to avoid leaking information about system capabilities
        return { success: true };
    }
}
