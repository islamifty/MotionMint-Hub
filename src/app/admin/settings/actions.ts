
'use server';

import { z } from 'zod';
import { createClient, type WebDAVClient } from 'webdav';

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

    // This is a mock verification. In a real app, you would make an API call
    // to a bKash endpoint (e.g., to get an auth token) to verify credentials.
    console.log('Verifying bKash credentials (mock):', result.data);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, message: 'bKash connection successful! (This is a mock response)' };
}


export async function saveNextcloudSettings(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    // In a real app, you would save these to a secure store.
    // For this prototype, we are using environment variables.
    // Note: In a real production environment, you would need a more robust way to manage and restart the server
    // for environment variable changes to take effect.
    process.env.NEXTCLOUD_URL = result.data.nextcloudUrl;
    process.env.NEXTCLOUD_USER = result.data.username;
    process.env.NEXTCLOUD_PASSWORD = result.data.appPassword;
    
    console.log('Saved Nextcloud settings to environment variables.');
    return { success: true };
}

export async function saveBKashSettings(data: unknown) {
    const result = bKashSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    console.log('Saving bKash settings:', result.data);
    return { success: true };
}

export async function savePipraPaySettings(data: unknown) {
    const result = pipraPaySchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    console.log('Saving PipraPay settings:', result.data);
    return { success: true };
}
