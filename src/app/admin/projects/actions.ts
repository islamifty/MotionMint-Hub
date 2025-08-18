
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
        return { 
            success: false, 
            error: "Nextcloud credentials are not configured. Cannot delete files."
        };
    }

    try {
        const client: WebDAVClient = createClient(nextcloudUrl, {
            username: nextcloudUser,
            password: nextcloudPassword,
        });

        const projectsToDelete = projects.filter(p => projectIds.includes(p.id));

        for (const project of projectsToDelete) {
            // Extract the file path from the URL.
            // Example URL: http://.../files/user/MotionFlowProjects/12345-video.mp4
            // We need the path: /MotionFlowProjects/12345-video.mp4
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
                // Decide if you want to stop or continue. For now, we'll log and continue.
            }
        }

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
        console.error("Failed to delete projects:", error);
        return { success: false, error: "An unexpected error occurred during project deletion." };
    }
}
