
'use server';

import { revalidatePath } from 'next/cache';
import { projects } from '@/lib/data';

export async function deleteProjects(projectIds: string[]) {
    try {
        const initialCount = projects.length;
        const newProjects = projects.filter(p => !projectIds.includes(p.id));
        
        // This simulates the data mutation for the demo
        projects.length = 0;
        Array.prototype.push.apply(projects, newProjects);
        
        if (projects.length === initialCount - projectIds.length) {
            revalidatePath('/admin/projects');
            return { success: true };
        } else {
            throw new Error("Some projects could not be deleted.");
        }

    } catch (error) {
        console.error("Failed to delete projects:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
