
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient, type WebDAVClient } from 'webdav';
import { projects, clients as allClients } from '@/lib/data';

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date(),
  // Nextcloud credentials are now part of the form data
  nextcloudUrl: z.string().url({ message: "Nextcloud URL is required." }),
  nextcloudUser: z.string().min(1, { message: "Nextcloud username is required." }),
  nextcloudPassword: z.string().min(1, { message: "Nextcloud password is required." }),
});

export async function addProject(formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    
    // Manually handle date and video file
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

    const { nextcloudUrl, nextcloudUser, nextcloudPassword, ...projectData } = result.data;

    try {
        const client: WebDAVClient = createClient(nextcloudUrl, {
            username: nextcloudUser,
            password: nextcloudPassword,
        });

        const projectsDir = '/MotionFlowProjects';
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

        const clientInfo = allClients.find(c => c.id === projectData.clientId);

        const newProject = {
            id: `proj-${Date.now()}`,
            title: projectData.title,
            description: projectData.description,
            clientId: projectData.clientId,
            amount: projectData.amount,
            expiryDate: projectData.expiryDate.toISOString(),
            clientName: clientInfo?.name || 'Unknown Client',
            paymentStatus: 'pending' as const,
            orderId: `ORD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            previewVideoUrl: fileUrl,
            finalVideoUrl: fileUrl
        };
        projects.unshift(newProject); // Add to the beginning of the array

        revalidatePath('/admin/projects'); // Refresh the projects page
        revalidatePath('/admin/dashboard'); // Refresh the dashboard
        revalidatePath('/client/dashboard'); // Refresh the client dashboard

        return { success: true };

    } catch (error) {
        console.error("Project creation failed:", error);
        return { success: false, error: { formErrors: ["Failed to upload video. Please check Nextcloud credentials and configuration."], fieldErrors: {} }};
    }
}
