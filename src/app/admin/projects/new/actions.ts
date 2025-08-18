'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient, type WebDAVClient } from 'webdav';
import { readDb, writeDb } from '@/lib/db';
import type { Project } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date(),
});

export async function addProject(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    
    if (rawData.expiryDate) {
        rawData.expiryDate = new Date(rawData.expiryDate as string);
    }
    const videoFile = formData.get('videoFile') as File | null;

    const result = projectSchema.safeParse(rawData);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    
    if (!videoFile || videoFile.size === 0) {
        return { success: false, error: { formErrors: ["A video file is required."], fieldErrors: {} }};
    }

    const { 
        NEXTCLOUD_URL: nextcloudUrl, 
        NEXTCLOUD_USER: nextcloudUser, 
        NEXTCLOUD_PASSWORD: nextcloudPassword 
    } = process.env;

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
        return { 
            success: false, 
            error: { 
                formErrors: ["Nextcloud credentials are not configured in environment variables. Please configure them in the settings page."], 
                fieldErrors: {} 
            }
        };
    }

    try {
        const client: WebDAVClient = createClient(nextcloudUrl, {
            username: nextcloudUser,
            password: nextcloudPassword,
        });

        const projectsDir = '/MotionMintHubProjects';
        if (!await client.exists(projectsDir)) {
            await client.createDirectory(projectsDir);
        }

        const fileName = `${Date.now()}-${videoFile.name}`;
        const filePath = `${projectsDir}/${fileName}`;
        
        const fileBuffer = Buffer.from(await videoFile.arrayBuffer());

        const uploadSuccess = await client.putFileContents(filePath, fileBuffer, { overwrite: true });
        
        if (!uploadSuccess) {
            throw new Error("Failed to upload file to Nextcloud.");
        }
        
        const fileUrl = `${nextcloudUrl}/files/${nextcloudUser}${filePath}`;
        
        const db = readDb();
        const clientInfo = db.clients.find(c => c.id === result.data.clientId);

        const newProject: Project = {
            id: `proj-${Date.now()}`,
            ...result.data,
            expiryDate: result.data.expiryDate.toISOString(),
            clientName: clientInfo?.name || 'Unknown Client',
            paymentStatus: 'pending' as const,
            orderId: `ORD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            previewVideoUrl: fileUrl,
            finalVideoUrl: fileUrl
        };
        db.projects.unshift(newProject);
        writeDb(db);

        revalidatePath('/admin/projects');
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');

        return { success: true };

    } catch (error) {
        console.error("Project creation failed:", error);
        return { success: false, error: { formErrors: ["Failed to upload video. Please check Nextcloud credentials and configuration."], fieldErrors: {} }};
    }
}
