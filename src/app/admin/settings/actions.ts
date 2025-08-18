
'use server';

import { z } from 'zod';

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

export async function saveNextcloudSettings(data: unknown) {
    const result = nextcloudSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    console.log('Saving Nextcloud settings:', result.data);
    // TODO: Implement actual saving logic (e.g., to a database or config file)
    return { success: true };
}

export async function saveBKashSettings(data: unknown) {
    const result = bKashSchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    console.log('Saving bKash settings:', result.data);
    // TODO: Implement actual saving logic
    return { success: true };
}

export async function savePipraPaySettings(data: unknown) {
    const result = pipraPaySchema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    console.log('Saving PipraPay settings:', result.data);
    // TODO: Implement actual saving logic
    return { success: true };
}
