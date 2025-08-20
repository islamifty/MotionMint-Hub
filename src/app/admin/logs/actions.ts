'use server';

import { readLogs, clearLogsFile } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export async function getLogs(): Promise<string> {
    return await readLogs();
}

export async function clearLogs() {
    try {
        await clearLogsFile();
        revalidatePath('/admin/logs');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
