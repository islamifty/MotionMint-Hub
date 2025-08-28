'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/turso';
import { projects, clients } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { Project } from '@/types';
import { sendSms } from '@/lib/sms';
import { unstable_noStore as noStore } from 'next/cache';

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
    noStore();
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return (result[0] as Project) || null;
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
    
    const projectToUpdate = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (projectToUpdate.length === 0) {
        return { success: false, error: { formErrors: ["Project not found."], fieldErrors: {} }};
    }
    
    try {
        const clientResult = await db.select().from(clients).where(eq(clients.id, result.data.clientId)).limit(1);
        const clientInfo = clientResult[0];
        const previousStatus = projectToUpdate[0].paymentStatus;

        const updatedProjectData = {
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
        
        await db.update(projects).set(updatedProjectData).where(eq(projects.id, id));
        
        if (clientInfo?.phone && result.data.paymentStatus === 'paid' && previousStatus !== 'paid') {
             try {
                await sendSms({
                    to: clientInfo.phone,
                    message: `Dear ${clientInfo.name}, your payment for project "${updatedProjectData.title}" has been confirmed. You can now download the final video. Thank you!`,
                });
            } catch (smsError) {
                console.error("Failed to send payment confirmation SMS:", smsError);
            }
        }

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
