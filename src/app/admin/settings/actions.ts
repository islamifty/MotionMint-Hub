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
    appKey: z.string().min(1),
    appSecret: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
});

const pipraPaySchema = z.object({
    apiKey: z.string().min(1),
    apiSecret: z.string().min(1),
});

export async function getSettings() {
    const db = readDb();
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
        return { success: false, message: 'Invalid credentials provided.' };
    }
    console.log('Verifying bKash credentials (mock):', result.data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'bKash connection successful! (This is a mock response)' };
}

export async function saveNextcloudSettings(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    
    try {
        const { nextcloudUrl, username, appPassword } = result.data;
        const db = readDb();
        db.settings.nextcloudUrl = nextcloudUrl;
        db.settings.nextcloudUser = username;
        db.settings.nextcloudPassword = appPassword;
        writeDb(db);
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
        const { appKey, appSecret, username, password } = result.data;
        const db = readDb();
        db.settings.bkashAppKey = appKey;
        db.settings.bkashAppSecret = appSecret;
        db.settings.bkashUsername = username;
        db.settings.bkashPassword = password;
        writeDb(db);
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
    console.log('Saving PipraPay settings:', result.data);
    return { success: true };
}
