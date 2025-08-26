
'use server';

import { z } from 'zod';
import { createClient, type WebDAVClient } from 'webdav';
import { readDb, writeDb } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const nextcloudSchema = z.object({
    nextcloudUrl: z.string().url(),
    username: z.string().min(1),
    appPassword: z.string().min(1),
});

const bKashSchema = z.object({
  bKashAppKey: z.string(),
  bKashAppSecret: z.string(),
  bKashUsername: z.string(),
  bKashPassword: z.string(),
  bKashMode: z.enum(["sandbox", "production"]),
});

const pipraPaySchema = z.object({
  piprapayApiKey: z.string(),
  piprapayBaseUrl: z.string().url(),
});

const generalSettingsSchema = z.object({
    whatsappLink: z.string().url("Please enter a valid WhatsApp link.").or(z.literal('')),
    logoUrl: z.string().url("Please enter a valid image URL.").or(z.literal('')),
});

const smtpSchema = z.object({
    smtpHost: z.string().min(1, "Host is required."),
    smtpPort: z.coerce.number().min(1, "Port is required."),
    smtpUser: z.string().min(1, "User is required."),
    smtpPass: z.string().min(1, "Password is required."),
});

const smsTestSchema = z.object({
    greenwebSmsToken: z.string().min(1, "Token is required."),
    testPhoneNumber: z.string().min(1, "A phone number is required to send a test SMS."),
});

export async function getSettings() {
    const db = await readDb();
    // Return only non-sensitive settings
    return {
        whatsappLink: db.settings.whatsappLink,
        logoUrl: db.settings.logoUrl,
    };
}

// Functions to check if credentials are set in environment variables
export async function checkEnvCredentials() {
    return {
        nextcloud: !!(process.env.NEXTCLOUD_URL && process.env.NEXTCLOUD_USER && process.env.NEXTCLOUD_PASSWORD),
        bkash: !!(process.env.BKASH_APP_KEY && process.env.BKASH_APP_SECRET && process.env.BKASH_USERNAME && process.env.BKASH_PASSWORD),
        piprapay: !!(process.env.PIPRAPAY_API_KEY && process.env.PIPRAPAY_BASE_URL && process.env.PIPRAPAY_WEBHOOK_VERIFY_KEY),
        smtp: !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS),
        sms: !!process.env.GREENWEB_SMS_TOKEN,
    };
}


export async function verifyNextcloudConnection(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: 'Invalid credentials provided.' };
    }

    try {
        const client: WebDAVClient = createClient(result.data.nextcloudUrl, {
            username: result.data.username,
            password: result.data.appPassword,
        });

        await client.getDirectoryContents('/');
        return { success: true, message: 'Connection successful!' };
    } catch (error) {
        console.error('Nextcloud connection error:', error);
        return { success: false, message: 'Connection failed. Please check your URL and credentials.' };
    }
}

export async function verifyBKashConnection(data: unknown) {
    const result = bKashSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: 'Invalid data provided for bKash verification.' };
    }

    const { bKashAppKey, bKashAppSecret, bKashUsername, bKashPassword, bKashMode } = result.data;

    try {
        const baseUrl = bKashMode === 'sandbox' ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
        
        const response = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'username': bKashUsername,
                'password': bKashPassword,
            },
            body: JSON.stringify({ app_key: bKashAppKey, app_secret: bKashAppSecret }),
            cache: 'no-store',
        });

        const responseData = await response.json();
        if (response.ok && responseData.id_token) {
            return { success: true, message: 'bKash connection successful!' };
        } else {
            return { success: false, message: responseData.statusMessage || 'bKash connection failed.' };
        }
    } catch (error) {
        console.error('bKash connection test error:', error);
        return { success: false, message: 'An error occurred while testing the connection.' };
    }
}

export async function verifyPipraPayConnection(data: unknown) {
    const result = pipraPaySchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: "Invalid PipraPay data provided." };
    }
    const { piprapayApiKey, piprapayBaseUrl } = result.data;

    try {
        const res = await fetch(`${piprapayBaseUrl}/verify-payments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mh-piprapay-api-key": piprapayApiKey,
            },
            body: JSON.stringify({ invoice_id: "test_connection" }), // Send a dummy invoice ID
            cache: "no-store",
        });

        const responseData = await res.json().catch(() => ({}));
        
        if (res.status === 404 && responseData?.status === false) {
             return { success: true, message: "Connection successful! (Test invoice not found as expected)" };
        } else if (!res.ok) {
            return { success: false, message: `Connection failed: ${responseData.message || "Invalid API Key or Base URL."}` };
        }
        
        return { success: true, message: "Connection successful!" };

    } catch (error: any) {
        console.error("PipraPay connection error:", error);
         if (error.cause?.code === 'ENOTFOUND') {
            return { success: false, message: `Connection failed: Could not resolve the Base URL. Please check the URL and your network connection.` };
        }
        return { success: false, message: "An unexpected error occurred during connection test." };
    }
}

export async function verifySmtpConnection(data: unknown) {
    const result = smtpSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: 'Invalid SMTP data provided.' };
    }

    try {
        await sendEmail({
            to: result.data.smtpUser,
            subject: 'SMTP Connection Test',
            text: 'If you received this email, your SMTP settings are correct!',
            html: '<p>If you received this email, your SMTP settings are correct!</p>'
        }, {
             host: result.data.smtpHost,
             port: result.data.smtpPort,
             user: result.data.smtpUser,
             pass: result.data.smtpPass
        });
        return { success: true, message: 'Test email sent successfully!' };
    } catch (error: any) {
        console.error('SMTP connection test error:', error);
        return { success: false, message: `Failed to send test email: ${error.message}` };
    }
}

export async function verifySmsConnection(data: unknown) {
    const result = smsTestSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: 'Invalid data provided for SMS test.' };
    }

    try {
        await sendSms({
            to: result.data.testPhoneNumber,
            message: 'Hello from MotionMint Hub! This is a test message.',
        }, {
            greenwebSmsToken: result.data.greenwebSmsToken,
        });
        return { success: true, message: 'Test SMS sent successfully!' };
    } catch (error: any) {
        console.error('SMS connection test error:', error);
        return { success: false, message: `Failed to send test SMS: ${error.message}` };
    }
}

export async function saveGeneralSettings(data: unknown) {
    const result = generalSettingsSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten(), message: "Validation failed." };
    }
    
    try {
        const { whatsappLink, logoUrl } = result.data;
        const db = await readDb();
        db.settings.whatsappLink = whatsappLink;
        db.settings.logoUrl = logoUrl;
        await writeDb(db);
        return { success: true, message: "General settings saved successfully." };
    } catch (error) {
        console.error("Failed to save General settings:", error);
        return { success: false, message: "Failed to save settings." };
    }
}
