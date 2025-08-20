
'use server';

import { z } from 'zod';
import { createClient, type WebDAVClient } from 'webdav';
import { readDb, writeDb } from '@/lib/db';

const nextcloudSchema = z.object({
    nextcloudUrl: z.string().url(),
    username: z.string().min(1),
    appPassword: z.string().min(1),
});

const bKashSchema = z.object({
  bKashEnabled: z.boolean().default(false),
  bKashAppKey: z.string().optional(),
  bKashAppSecret: z.string().optional(),
  bKashUsername: z.string().optional(),
  bKashPassword: z.string().optional(),
  bKashMode: z.enum(["sandbox", "production"]).default("sandbox"),
});

const pipraPaySchema = z.object({
  pipraPayEnabled: z.boolean().default(false),
  piprapayApiKey: z.string().optional(),
  piprapayBaseUrl: z.string().min(1, "Base URL is required.").optional().or(z.literal('')),
  piprapayWebhookVerifyKey: z.string().optional(),
});

const generalSettingsSchema = z.object({
    whatsappLink: z.string().url("Please enter a valid WhatsApp link.").or(z.literal('')),
    logoUrl: z.string().url("Please enter a valid image URL.").or(z.literal('')),
});

export async function getSettings() {
    const db = await readDb();
    return db.settings || {};
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

    if (!bKashAppKey || !bKashAppSecret || !bKashUsername || !bKashPassword) {
        return { success: false, message: 'Please provide all bKash credentials to test the connection.' };
    }

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

    if (!piprapayApiKey || !piprapayBaseUrl) {
        return { success: false, message: "Please provide both API Key and Base URL." };
    }

    try {
        const res = await fetch(`${piprapayBaseUrl}/api/verify-payments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mh-piprapay-api-key": piprapayApiKey,
            },
            body: JSON.stringify({ invoice_id: "test_connection" }), // Send a dummy invoice ID
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));
        
        if (res.status === 404 && data?.status === false) {
             return { success: true, message: "Connection successful! (Test invoice not found as expected)" };
        } else if (!res.ok) {
            return { success: false, message: `Connection failed: ${data.message || "Invalid API Key or Base URL."}` };
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

export async function saveNextcloudSettings(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: "Invalid data", error: result.error.flatten() };
    }
    
    try {
        const { nextcloudUrl, username, appPassword } = result.data;
        const db = await readDb();
        db.settings.nextcloudUrl = nextcloudUrl;
        db.settings.nextcloudUser = username;
        db.settings.nextcloudPassword = appPassword;
        await writeDb(db);
        return { success: true, message: "Nextcloud settings saved successfully." };
    } catch (error) {
        console.error("Failed to save Nextcloud settings:", error);
        return { success: false, message: "Failed to save settings." };
    }
}

export async function saveBKashSettings(data: unknown) {
    const result = bKashSchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: "Invalid data", error: result.error.flatten() };
    }
    
    try {
        const db = await readDb();
        db.settings = { ...db.settings, ...result.data };
        await writeDb(db);
        return { success: true, message: "bKash settings saved successfully." };
    } catch (error) {
        console.error("Failed to save bKash settings:", error);
        return { success: false, message: "Failed to save settings." };
    }
}

export async function savePipraPaySettings(data: unknown) {
    const result = pipraPaySchema.safeParse(data);
    if (!result.success) {
        return { success: false, message: "Invalid data", error: result.error.flatten() };
    }
    
    try {
        const db = await readDb();
        db.settings = { ...db.settings, ...result.data };
        await writeDb(db);
        return { success: true, message: "PipraPay settings saved successfully." };
    } catch (error) {
        console.error("Failed to save PipraPay settings:", error);
        return { success: false, message: "Failed to save settings." };
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
