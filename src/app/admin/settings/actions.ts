
'use server';

import { z } from 'zod';
import { createClient, type WebDAVClient } from 'webdav';
import { readDb, writeDb } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import type { AppSettings } from '@/types';

// Schemas for saving settings
const nextcloudSchema = z.object({
    nextcloudUrl: z.string().url().or(z.literal('')),
    nextcloudUser: z.string().optional(),
    nextcloudPassword: z.string().optional(),
});

const bKashSchema = z.object({
  bKashAppKey: z.string().optional(),
  bKashAppSecret: z.string().optional(),
  bKashUsername: z.string().optional(),
  bKashPassword: z.string().optional(),
  bKashMode: z.enum(["sandbox", "production"]).default("sandbox"),
});

const pipraPaySchema = z.object({
  piprapayApiKey: z.string().optional(),
  piprapayBaseUrl: z.string().url().or(z.literal('')),
  piprapayWebhookVerifyKey: z.string().optional(),
});

const generalSettingsSchema = z.object({
    whatsappLink: z.string().url("Please enter a valid WhatsApp link.").or(z.literal('')),
    logoUrl: z.string().url("Please enter a valid image URL.").or(z.literal('')),
});

const smtpSchema = z.object({
    smtpHost: z.string().optional(),
    smtpPort: z.coerce.number().optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
});

const smsSchema = z.object({
    greenwebSmsToken: z.string().optional(),
});

// Schemas for testing connections (fields are required)
const nextcloudTestSchema = nextcloudSchema.extend({
    nextcloudUrl: z.string().url({ message: "URL is required for testing." }),
    nextcloudUser: z.string().min(1, { message: "Username is required for testing." }),
    nextcloudPassword: z.string().min(1, { message: "Password is required for testing." }),
});
const bKashTestSchema = bKashSchema.extend({
    bKashAppKey: z.string().min(1, "App Key is required"),
    bKashAppSecret: z.string().min(1, "App Secret is required"),
    bKashUsername: z.string().min(1, "Username is required"),
    bKashPassword: z.string().min(1, "Password is required"),
});
const pipraPayTestSchema = pipraPaySchema.extend({
    piprapayApiKey: z.string().min(1, "API Key is required"),
    piprapayBaseUrl: z.string().url("A valid URL is required"),
});
const smtpTestSchema = smtpSchema.extend({
    smtpHost: z.string().min(1, "Host is required."),
    smtpPort: z.coerce.number().min(1, "Port is required."),
    smtpUser: z.string().min(1, "User is required."),
    smtpPass: z.string().min(1, "Password is required."),
});
const smsTestSchema = smsSchema.extend({
    greenwebSmsToken: z.string().min(1, "Token is required."),
});

export async function getSettings(): Promise<AppSettings> {
    const db = await readDb();
    return db.settings || {};
}

export async function checkDbCredentials() {
    const db = await readDb();
    const settings = db.settings || {};
    return {
        nextcloud: !!(settings.nextcloudUrl && settings.nextcloudUser && settings.nextcloudPassword),
        bkash: !!(settings.bKashAppKey && settings.bKashAppSecret && settings.bKashUsername && settings.bKashPassword),
        piprapay: !!(settings.piprapayApiKey && settings.piprapayBaseUrl && settings.piprapayWebhookVerifyKey),
        smtp: !!(settings.smtpHost && settings.smtpPort && settings.smtpUser && settings.smtpPass),
        sms: !!settings.greenwebSmsToken,
    };
}


export async function verifyNextcloudConnection(data: unknown) {
    const result = nextcloudTestSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: 'Invalid credentials provided for testing.' };
    }

    try {
        const client: WebDAVClient = createClient(result.data.nextcloudUrl, {
            username: result.data.nextcloudUser,
            password: result.data.nextcloudPassword,
        });

        await client.getDirectoryContents('/');
        return { success: true, message: 'Connection successful!' };
    } catch (error) {
        console.error('Nextcloud connection error:', error);
        return { success: false, message: 'Connection failed. Please check your URL and credentials.' };
    }
}

export async function verifyBKashConnection(data: unknown) {
    const result = bKashTestSchema.safeParse(data);
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
    const result = pipraPayTestSchema.safeParse(data);
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
            body: JSON.stringify({ invoice_id: "test_connection" }),
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
    const result = smtpTestSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: 'Invalid SMTP data provided for testing.' };
    }

    try {
        await sendEmail({
            to: result.data.smtpUser,
            subject: 'SMTP Connection Test',
            text: 'If you received this email, your SMTP settings are correct!',
            html: '<p>If you received this email, your SMTP settings are correct!</p>'
        }, {
             smtpHost: result.data.smtpHost,
             smtpPort: result.data.smtpPort,
             smtpUser: result.data.smtpUser,
             smtpPass: result.data.smtpPass
        });
        return { success: true, message: 'Test email sent successfully!' };
    } catch (error: any) {
        console.error('SMTP connection test error:', error);
        return { success: false, message: `Failed to send test email: ${error.message}` };
    }
}

export async function verifySmsConnection(data: unknown, testPhoneNumber: string) {
    const result = smsTestSchema.safeParse(data);
     if (!result.success) {
        return { success: false, message: 'Invalid data provided for SMS test.' };
    }
    if (!testPhoneNumber) {
        return { success: false, message: 'Test phone number is required.' };
    }

    try {
        await sendSms({
            to: testPhoneNumber,
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

// Unified save function
async function saveSettings(update: Partial<AppSettings>) {
    try {
        const db = await readDb();
        db.settings = { ...db.settings, ...update };
        await writeDb(db);
        return { success: true, message: "Settings saved successfully." };
    } catch (error) {
        console.error("Failed to save settings:", error);
        return { success: false, message: "Failed to save settings." };
    }
}

export async function saveNextcloudSettings(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid Nextcloud data." };
    return saveSettings(result.data);
}
export async function saveBKashSettings(data: unknown) {
    const result = bKashSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid bKash data." };
    return saveSettings(result.data);
}
export async function savePipraPaySettings(data: unknown) {
    const result = pipraPaySchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid PipraPay data." };
    return saveSettings(result.data);
}
export async function saveSmtpSettings(data: unknown) {
    const result = smtpSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid SMTP data." };
    return saveSettings(result.data);
}
export async function saveSmsSettings(data: unknown) {
    const result = smsSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid SMS data." };
    return saveSettings(result.data);
}
export async function saveGeneralSettings(data: unknown) {
    const result = generalSettingsSchema.safeParse(data);
    if (!result.success) return { success: false, message: "Invalid General settings data." };
    return saveSettings(result.data);
}
