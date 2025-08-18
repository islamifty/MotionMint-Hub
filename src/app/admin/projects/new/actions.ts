'use server';

import { z } from 'zod';
import { projects } from '@/lib/data'; // Assuming we'll push to this mock data array

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date(),
});

export async function addProject(data: unknown) {
    const result = projectSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: result.error.flatten() };
    }
    
    console.log('Adding new project:', result.data);
    // In a real application, you would save this to a database.
    // Here we just log it and simulate success.
    
    // Example of adding to in-memory data (won't persist across requests on serverless env):
    /*
    const newProject = {
        id: `proj-${Date.now()}`,
        ...result.data,
        clientName: 'Client Name', // You'd look this up from the clientId
        paymentStatus: 'pending',
        orderId: `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        previewVideoUrl: 'https://placehold.co/1280x720.png',
    }
    projects.push(newProject);
    */

    return { success: true };
}
