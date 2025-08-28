'use server';

import { revalidatePath } from 'next/cache';
import { createClient, type WebDAVClient } from 'webdav';
import { db } from '@/lib/turso';
import { projects, settings } from '@/lib/schema';
import { inArray, desc, eq } from 'drizzle-orm';
import type { Project } from '@/types';
import { unstable_noStore as noStore } from 'next/cache';

export async function getProjects(): Promise<Project[]> {
    noStore();
    const projectData = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return projectData as Project[];
}


export async function deleteProjects(projectIds: string[]) {
    noStore();
    const settingsResult = await db.select().from(settings).where(
        inArray(settings.key, ['nextcloudUrl', 'nextcloudUser', 'nextcloudPassword'])
    );

    const creds = settingsResult.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {} as Record<string, string | null>);
    
    const { 
        nextcloudUrl, 
        nextcloudUser, 
        nextcloudPassword 
    } = creds;

    const projectsToDelete = await db.select().from(projects).where(inArray(projects.id, projectIds));

    if (nextcloudUrl && nextcloudUser && nextcloudPassword) {
        try {
            const client: WebDAVClient = createClient(nextcloudUrl, {
                username: nextcloudUser,
                password: nextcloudPassword,
            });
    
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
        }
    } else {
        console.warn("Nextcloud credentials are not configured. Cannot delete files, but will delete project entries.");
    }

    try {
        const result = await db.delete(projects).where(inArray(projects.id, projectIds));
        
        revalidatePath('/admin/projects');
        return { success: true };

    } catch (error) {
        console.error("Failed to delete projects from db:", error);
        return { success: false, error: "An unexpected error occurred during project deletion." };
    }
}
