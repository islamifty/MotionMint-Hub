
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
  paymentStatus: z.enum(["pending", "paid", "overdue"]),
  previewVideoUrl: z.string().url("Please provide a valid preview video URL."),
  finalVideoUrl: z.string().url("Please provide a valid final video URL."),
});

export async function getProjectById(id: string): Promise<Project | null> {
    const db = readDb();
    const project = db.projects.find(p => p.id === id);
    return project || null;
}

export async function updateProject(id: string, data: unknown) {
    const rawData = { ... (data as object) };
    
    if (rawData.expiryDate && typeof rawData.expiryDate === 'string') {
        (rawData as any).expiryDate = new Date(rawData.expiryDate as string);
    }

    const result = projectSchema.safeParse(rawData);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    
    const db = readDb();
    const projectIndex = db.projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
        return { success: false, error: { formErrors: ["Project not found."], fieldErrors: {} }};
    }
    
    try {
        const clientInfo = db.clients.find(c => c.id === result.data.clientId);

        const updatedProject: Project = {
            ...db.projects[projectIndex], // Keep original id, orderId, createdAt
            title: result.data.title,
            description: result.data.description,
            clientId: result.data.clientId,
            clientName: clientInfo?.name || 'Unknown Client',
            amount: result.data.amount,
            expiryDate: result.data.expiryDate.toISOString(),
            paymentStatus: result.data.paymentStatus,
            previewVideoUrl: result.data.previewVideoUrl,
            finalVideoUrl: result.data.finalVideoUrl,
        };
        
        db.projects[projectIndex] = updatedProject;
        writeDb(db);

        // Revalidate all relevant paths
        revalidatePath('/admin/projects');
        revalidatePath(`/admin/projects/edit/${id}`);
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');
        revalidatePath(`/client/projects/${id}`);

        return { success: true };

    } catch (error) {
        console.error("Project update failed:", error);
        return { success: false, error: { formErrors: ["An unexpected error occurred during project update."], fieldErrors: {} }};
    }
}
