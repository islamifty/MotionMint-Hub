
'use server';

// This functionality is deprecated in favor of Vercel's built-in logging.

export async function getLogs(): Promise<string> {
    return "File-based logging is disabled in this environment. Please use your hosting provider's logging service (e.g., Vercel Logs).";
}

export async function clearLogs() {
    return { success: true, message: "Logging is managed by the hosting provider." };
}
