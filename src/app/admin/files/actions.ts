'use server';

import { createClient, type FileStat, type WebDAVClient } from 'webdav';
import { db } from '@/lib/turso';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

async function getNextcloudCredentials() {
    const credentials = await db.select().from(settings).where(
        inArray(settings.key, ['nextcloudUrl', 'nextcloudUser', 'nextcloudPassword'])
    );

    const credsMap = credentials.reduce((acc, cred) => {
        acc[cred.key] = cred.value;
        return acc;
    }, {} as Record<string, string | null>);
    
    return {
        nextcloudUrl: credsMap.nextcloudUrl,
        nextcloudUser: credsMap.nextcloudUser,
        nextcloudPassword: credsMap.nextcloudPassword,
    };
}

async function getClient(): Promise<WebDAVClient> {
    const { nextcloudUrl, nextcloudUser, nextcloudPassword } = await getNextcloudCredentials();

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
        throw new Error('Nextcloud credentials are not configured in settings.');
    }

    return createClient(nextcloudUrl, {
        username: nextcloudUser,
        password: nextcloudPassword,
    });
}

export async function getDirectoryContents(directory: string): Promise<FileStat[]> {
    try {
        const client = await getClient();
        const contents = (await client.getDirectoryContents(directory)) as FileStat[];
        // Sort contents: folders first, then files, all alphabetically
        return contents.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') {
                return -1;
            }
            if (a.type !== 'directory' && b.type === 'directory') {
                return 1;
            }
            return a.basename.localeCompare(b.basename);
        });
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return []; // Directory not found, return empty array
        }
        console.error(`Failed to get contents for "${directory}":`, error.message);
        throw new Error(`Could not retrieve directory contents. Please check your Nextcloud connection.`);
    }
}

export async function createDirectory(path: string) {
    try {
        const client = await getClient();
        if (await client.exists(path)) {
             return { success: false, message: 'A folder with this name already exists.' };
        }
        await client.createDirectory(path);
        return { success: true, message: 'Folder created successfully.' };
    } catch (error) {
        console.error('Failed to create directory:', error);
        throw new Error('Could not create the directory.');
    }
}

export async function deleteFileOrFolder(path: string) {
    try {
        const client = await getClient();
        await client.deleteFile(path);
        return { success: true, message: 'Item deleted successfully.' };
    } catch (error) {
        console.error('Failed to delete item:', error);
        throw new Error('Could not delete the item.');
    }
}

export async function getDownloadLink(path: string): Promise<string> {
    const client = await getClient();
    // This creates a direct download link. For Nextcloud, this usually works without special signing.
    // The link is constructed from the base URL and the file path.
    const baseUrl = client.getEndpoint().toString().replace('/remote.php/dav/files' + client.getUsername(), '');
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `${baseUrl}/s/${encodedPath}`; // This might need adjustment based on Nextcloud share link structure
}

export async function getThumbnailBaseUrl(): Promise<string> {
    const { nextcloudUrl, nextcloudUser } = await getNextcloudCredentials();
    if (!nextcloudUrl || !nextcloudUser) {
        return '';
    }
    return nextcloudUrl.replace('/remote.php/dav/files/' + nextcloudUser, '') || '';
}
