
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readDb, writeDb } from '@/lib/db';
import type { Project } from '@/types';

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date(),
  previewVideoUrl: z.string().url("Please provide a valid preview video URL."),
  finalVideoUrl: z.string().url("Please provide a valid final video URL."),
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
    
    const db = await readDb();
    
    try {
        const clientInfo = db.clients.find(c => c.id === result.data.clientId);
        const projectId = `proj-${Date.now()}`;

        const newProject: Project = {
            id: projectId,
            title: result.data.title,
            description: result.data.description,
            clientId: result.data.clientId,
            amount: result.data.amount,
            expiryDate: result.data.expiryDate.toISOString(),
            clientName: clientInfo?.name || 'Unknown Client',
            paymentStatus: 'pending' as const,
            orderId: `ORD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            previewVideoUrl: result.data.previewVideoUrl,
            finalVideoUrl: result.data.finalVideoUrl, 
        };
        db.projects.unshift(newProject);
        await writeDb(db);

        revalidatePath('/admin/projects');
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');

        return { success: true };

    } catch (error) {
        console.error("Project creation failed:", error);
        return { success: false, error: { formErrors: ["An unexpected error occurred during project creation."], fieldErrors: {} }};
    }
}
