'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient, type WebDAVClient, type FileStat } from 'webdav';
import { readDb, writeDb } from '@/lib/db';
import type { Project } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date(),
  videoUrl: z.string().url("Please provide a valid video URL."),
});


export async function addProject(data: unknown) {
    const rawData = { ... (data as object) };
    
    if (rawData.expiryDate) {
        (rawData as any).expiryDate = new Date(rawData.expiryDate as string);
    }

    const result = projectSchema.safeParse(rawData);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    
    const db = readDb();
    
    try {
        const clientInfo = db.clients.find(c => c.id === result.data.clientId);

        const newProject: Project = {
            id: `proj-${Date.now()}`,
            title: result.data.title,
            description: result.data.description,
            clientId: result.data.clientId,
            amount: result.data.amount,
            expiryDate: result.data.expiryDate.toISOString(),
            clientName: clientInfo?.name || 'Unknown Client',
            paymentStatus: 'pending' as const,
            orderId: `ORD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            previewVideoUrl: result.data.videoUrl, // Use the provided URL
            finalVideoUrl: result.data.videoUrl // Use the same URL for final for now
        };
        db.projects.unshift(newProject);
        writeDb(db);

        revalidatePath('/admin/projects');
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');

        return { success: true };

    } catch (error) {
        console.error("Project creation failed:", error);
        return { success: false, error: { formErrors: ["An unexpected error occurred during project creation."], fieldErrors: {} }};
    }
}


export async function getDirectoryContents(path: string = '/'): Promise<FileStat[]> {
    const db = readDb();
    const { nextcloudUrl, nextcloudUser, nextcloudPassword } = db.settings;

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
        throw new Error("Nextcloud credentials are not configured.");
    }

    try {
        const client: WebDAVClient = createClient(nextcloudUrl, {
            username: nextcloudUser,
            password: nextcloudPassword,
        });

        const contents = await client.getDirectoryContents(path) as FileStat[];
        // Sort with directories first, then by name
        return contents.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.basename.localeCompare(b.basename);
        });
    } catch (error) {
        console.error("Failed to get Nextcloud directory contents:", error);
        // It's better to throw the error so the client-side can know something went wrong
        throw new Error("Could not connect to Nextcloud or read directory. Please check your settings.");
    }
}
