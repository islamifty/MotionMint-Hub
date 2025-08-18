'use server';

import { z } from 'zod';
import { createClient, type WebDAVClient } from 'webdav';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';


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

async function updateEnvFile(settings: Record<string, string>) {
    const envFilePath = path.join(process.cwd(), '.env');
    try {
        let envFileContent = '';
        try {
            envFileContent = await fs.readFile(envFilePath, 'utf-8');
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        let newEnvContent = envFileContent;

        for (const [key, value] of Object.entries(settings)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            const settingLine = `${key}="${value}"`;
            if (regex.test(newEnvContent)) {
                newEnvContent = newEnvContent.replace(regex, settingLine);
            } else {
                newEnvContent += `\n${settingLine}`;
            }
        }

        await fs.writeFile(envFilePath, newEnvContent.trim());
        
        // Update current process's env vars
        for (const [key, value] of Object.entries(settings)) {
            process.env[key] = value;
        }

        return { success: true, message: "Settings saved successfully. Please restart the development server for changes to take full effect." };
    } catch (error) {
        console.error('Failed to save settings to .env file:', error);
        return { success: false, message: 'Failed to save settings to .env file.' };
    }
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
    
    const { nextcloudUrl, username, appPassword } = result.data;
    return await updateEnvFile({
        NEXTCLOUD_URL: nextcloudUrl,
        NEXTCLOUD_USER: username,
        NEXTCLOUD_PASSWORD: appPassword,
    });
}

export async function saveBKashSettings(data: unknown) {
    const result = bKashSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }

    const { appKey, appSecret, username, password } = result.data;
    return await updateEnvFile({
        BKASH_APP_KEY: appKey,
        BKASH_APP_SECRET: appSecret,
        BKASH_USERNAME: username,
        BKASH_PASSWORD: password,
    });
}

export async function savePipraPaySettings(data: unknown) {
    const result = pipraPaySchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    console.log('Saving PipraPay settings:', result.data);
    return { success: true };
}
