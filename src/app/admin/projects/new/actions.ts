'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/turso';
import { projects, clients } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { Project } from '@/types';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';
import { getBaseUrl } from '@/lib/url';

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
    
    try {
        const clientResult = await db.select().from(clients).where(eq(clients.id, result.data.clientId)).limit(1);
        const clientInfo = clientResult[0];

        if (!clientInfo) {
             return { success: false, error: { formErrors: ["Selected client not found."], fieldErrors: {} }};
        }

        const projectId = `proj-${Date.now()}`;

        const newProject: Project = {
            id: projectId,
            title: result.data.title,
            description: result.data.description,
            clientId: result.data.clientId,
            amount: result.data.amount,
            expiryDate: result.data.expiryDate.toISOString(),
            clientName: clientInfo.name,
            paymentStatus: 'pending' as const,
            orderId: `ORD-${Date.now()}`,
            createdAt: new Date().toISOString(),
            previewVideoUrl: result.data.previewVideoUrl,
            finalVideoUrl: result.data.finalVideoUrl, 
        };
        await db.insert(projects).values(newProject);

        // Revalidate paths
        revalidatePath('/admin/projects');
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');
        
        const appUrl = getBaseUrl();
        // Send email notification
        try {
            await sendEmail({
                to: clientInfo.email,
                subject: `New Project Created: ${newProject.title}`,
                html: `
                    <h1>New Project Alert!</h1>
                    <p>Hello ${clientInfo.name},</p>
                    <p>A new project titled "<strong>${newProject.title}</strong>" has been created for you.</p>
                    <p>You can view the project details and make payments by clicking the link below:</p>
                    <a href="${appUrl}/client/projects/${newProject.id}">View Project</a>
                    <p>Thank you!</p>
                `,
            });
        } catch (emailError) {
            console.error("Failed to send new project email:", emailError);
            // Don't block the success response for an email failure, but log it.
        }
        
        // Send SMS notification
        if (clientInfo.phone) {
             try {
                await sendSms({
                    to: clientInfo.phone,
                    message: `Hello ${clientInfo.name}, a new project "${newProject.title}" has been created for you. Please log in to your dashboard to view details.`,
                });
            } catch (smsError) {
                console.error("Failed to send new project SMS:", smsError);
            }
        }


        return { success: true };

    } catch (error) {
        console.error("Project creation failed:", error);
        return { success: false, error: { formErrors: ["An unexpected error occurred during project creation."], fieldErrors: {} }};
    }
}
