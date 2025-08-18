
'use server';

import { revalidatePath } from 'next/cache';
import { readDb, writeDb } from '@/lib/db';
import { createClient, type WebDAVClient } from 'webdav';
import type { Project } from '@/types';

export async function getProjects(): Promise<Project[]> {
    const db = readDb();
    return db.projects;
}


export async function deleteProjects(projectIds: string[]) {
    const { 
        NEXTCLOUD_URL: nextcloudUrl, 
        NEXTCLOUD_USER: nextcloudUser, 
        NEXTCLOUD_PASSWORD: nextcloudPassword 
    } = process.env;

    const db = readDb();
    const projectsToDelete = db.projects.filter(p => projectIds.includes(p.id));

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
        const updatedProjects = db.projects.filter(p => !projectIds.includes(p.id));
        
        if (db.projects.length - updatedProjects.length === projectIds.length) {
            writeDb({ ...db, projects: updatedProjects });
            revalidatePath('/admin/projects');
            return { success: true };
        } else {
            throw new Error("Some projects could not be deleted from the database.");
        }

    } catch (error) {
        console.error("Failed to delete projects from db.json:", error);
        return { success: false, error: "An unexpected error occurred during project deletion." };
    }
}
