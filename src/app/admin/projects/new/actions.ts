'use server';

import { z } from 'zod';
import { projects } from '@/lib/data'; // Assuming we'll push to this mock data array

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date(),
  videoFile: z.any().optional(), // Allow file upload
});

export async function addProject(data: unknown) {
    const result = projectSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    
    // In a real app, you would handle the file upload to Nextcloud here.
    console.log('Adding new project:', result.data);
    
    // Example of adding to in-memory data (won't persist across requests on serverless env):
    /*
    const newProject = {
        id: `proj-${Date.now()}`,
        ...result.data,
        clientName: 'Client Name', // You'd look this up from the clientId
        paymentStatus: 'pending',
        orderId: `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        previewVideoUrl: 'https://placehold.co/1280x720.png', // This would come from the Nextcloud upload
    }
    projects.push(newProject);
    */

    return { success: true };
}
