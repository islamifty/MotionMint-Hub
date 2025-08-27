
'use server';

import { z } from 'zod';
import { readDb, writeDb } from "@/lib/db";
import type { User, Client } from '@/types';
import { revalidatePath } from "next/cache";
import { createSession, getSession } from "@/lib/session";
import { sendSms } from '@/lib/sms';
import { hashPassword } from '@/lib/password';

const registerSchema = z.object({
  name: z.string().min(1, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  phone: z.string().min(11, "A valid phone number is required."),
  otp: z.string().min(6, "A 6-digit OTP is required."),
});

export async function sendOtp(phone: string) {
    if (!phone || phone.length < 11) {
        return { success: false, error: "Please enter a valid phone number." };
    }

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        const existingSession = await getSession();
        await createSession({ ...existingSession, otp, otpExpiry: otpExpiry.toISOString() });

        await sendSms({
            to: phone,
            message: `Your MotionMint Hub verification code is: ${otp}`,
        });
        
        console.info(`OTP sent to ${phone}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send OTP SMS', { error: error.message, phone });
        return { success: false, error: "Could not send OTP. Please try again later." };
    }
}


export async function addNewUser(userData: unknown) {
    const result = registerSchema.safeParse(userData);
    if (!result.success) {
        // Find the first error message and return it
        const firstError = result.error.errors[0]?.message || "Invalid data provided.";
        return { success: false, error: firstError };
    }
    
    const { name, email, password, phone, otp } = result.data;

    const session = await getSession();
    if (!session?.otp || !session?.otpExpiry) {
        return { success: false, error: "OTP has not been sent or has expired. Please try again." };
    }

    if (new Date(session.otpExpiry) < new Date()) {
        return { success: false, error: "OTP has expired. Please request a new one." };
    }

    if (session.otp !== otp) {
        return { success: false, error: "The OTP you entered is incorrect." };
    }
    
    const db = await readDb();

    if (db.users.some(u => u.email === email)) {
        return { success: false, error: "An account with this email already exists." };
    }
    if (db.users.some(u => u.phone === phone)) {
        return { success: false, error: "An account with this phone number already exists." };
    }

    const newUserId = `user-${Date.now()}`;
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
        id: newUserId,
        name,
        email,
        phone,
        role: "client",
        initials: (name || email).substring(0,2).toUpperCase(),
        password: hashedPassword,
    };
    
    const newClient: Client = {
        id: newUserId,
        name: name,
        email: email,
        phone: phone,
        company: "",
        projectIds: [],
        createdAt: new Date().toISOString(),
    };

    try {
        db.users.unshift(newUser);
        db.clients.unshift(newClient);
        
        await writeDb(db);

        // Clear OTP from session after successful registration
        const { otp: _, otpExpiry: __, ...sessionWithoutOtp } = session;
        await createSession(sessionWithoutOtp);
        
        revalidatePath('/admin/users');
        revalidatePath('/admin/clients');

        return { success: true };
    } catch (error) {
        console.error("Error adding user/client to mock data: ", { error, email });
        return { success: false, error: "Failed to save user profile." };
    }
}
