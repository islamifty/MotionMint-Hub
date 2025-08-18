
'use server';

import { revalidatePath } from 'next/cache';
import { projects } from '@/lib/data';
import { createClient, type WebDAVClient } from 'webdav';

export async function deleteProjects(projectIds: string[]) {
    const { 
        NEXTCLOUD_URL: nextcloudUrl, 
        NEXTCLOUD_USER: nextcloudUser, 
        NEXTCLOUD_PASSWORD: nextcloudPassword 
    } = process.env;

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
        // Since we are proceeding with in-memory deletion, we can treat this as a warning.
        console.warn("Nextcloud credentials are not configured. Cannot delete files, but will delete project entries.");
    } else {
        try {
            const client: WebDAVClient = createClient(nextcloudUrl, {
                username: nextcloudUser,
                password: nextcloudPassword,
            });
    
            const projectsToDelete = projects.filter(p => projectIds.includes(p.id));
    
            for (const project of projectsToDelete) {
                try {
                    const url = new URL(project.previewVideoUrl);
                    const pathParts = url.pathname.split('/');
                    const userIndex = pathParts.indexOf(nextcloudUser);
                    if (userIndex !== -1 && pathParts.length > userIndex + 1) {
                        const filePath = '/' + pathParts.slice(userIndex + 1).join('/');
                        if (await client.exists(filePath)) {
                            await client.deleteFile(filePath);
                        }
                    }
                } catch (e) {
                    console.warn(`Could not parse URL or delete file for project ${project.id}:`, project.previewVideoUrl);
                }
            }
        } catch (error) {
            console.error("Failed to connect to Nextcloud during project deletion:", error);
            // We can decide to stop or continue. Let's continue with in-memory deletion.
        }
    }


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
            throw new Error("Some projects could not be deleted from the database.");
        }

    } catch (error) {
        console.error("Failed to delete projects from in-memory array:", error);
        return { success: false, error: "An unexpected error occurred during project deletion." };
    }
}
