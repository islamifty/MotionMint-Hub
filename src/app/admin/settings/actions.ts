
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
    bKashEnabled: z.boolean(),
});

const pipraPaySchema = z.object({
    apiKey: z.string().min(1),
    piprapayBaseUrl: z.string().url({ message: "Please enter a valid Base URL." }),
    pipraPayEnabled: z.boolean(),
});

const generalSettingsSchema = z.object({
    whatsappLink: z.string().url("Please enter a valid WhatsApp link.").or(z.literal('')),
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

export async function verifyBKashConnection() {
    try {
        // We can simulate a token request to verify credentials
        const { BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD, BKASH_MODE } = process.env;
        if (!BKASH_APP_KEY || !BKASH_APP_SECRET || !BKASH_USERNAME || !BKASH_PASSWORD) {
            return { success: false, message: 'bKash credentials are not set in the .env file.' };
        }
        
        const response = await fetch(`${BKASH_MODE === 'sandbox' ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta'}/tokenized/checkout/token/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'username': BKASH_USERNAME,
                'password': BKASH_PASSWORD,
            },
            body: JSON.stringify({ app_key: BKASH_APP_KEY, app_secret: BKASH_APP_SECRET }),
        });

        const data = await response.json();
        if (response.ok && data.id_token) {
            return { success: true, message: 'bKash connection successful!' };
        } else {
            return { success: false, message: data.statusMessage || 'bKash connection failed.' };
        }
    } catch (error) {
        console.error('bKash connection test error:', error);
        return { success: false, message: 'An error occurred while testing the connection.' };
    }
}

export async function saveNextcloudSettings(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
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
        return { success: false, error: result.error.flatten() };
    }
    
    try {
        const { bKashEnabled } = result.data;
        const db = await readDb();
        db.settings.bKashEnabled = bKashEnabled;
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
        return { success: false, error: result.error.flatten() };
    }
    
    try {
        const { apiKey, piprapayBaseUrl, pipraPayEnabled } = result.data;
        const db = await readDb();
        db.settings.piprapayApiKey = apiKey;
        db.settings.piprapayBaseUrl = piprapayBaseUrl;
        db.settings.pipraPayEnabled = pipraPayEnabled;
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
        const { whatsappLink } = result.data;
        const db = await readDb();
        db.settings.whatsappLink = whatsappLink;
        await writeDb(db);
        return { success: true, message: "General settings saved successfully." };
    } catch (error) {
        console.error("Failed to save General settings:", error);
        return { success: false, message: "Failed to save settings." };
    }
}
