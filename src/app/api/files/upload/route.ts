import { NextRequest, NextResponse } from 'next/server';
import { createClient, type WebDAVClient } from 'webdav';
import { db } from '@/lib/turso';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { Writable } from 'stream';

// Helper to get Nextcloud client
async function getClient(): Promise<WebDAVClient> {
    const credentials = await db.select().from(settings).where(
        inArray(settings.key, ['nextcloudUrl', 'nextcloudUser', 'nextcloudPassword'])
    );
    const credsMap = credentials.reduce((acc, cred) => {
        acc[cred.key] = cred.value;
        return acc;
    }, {} as Record<string, string | null>);
    const { nextcloudUrl, nextcloudUser, nextcloudPassword } = credsMap;

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
        throw new Error('Nextcloud credentials are not configured.');
    }

    return createClient(nextcloudUrl, {
        username: nextcloudUser,
        password: nextcloudPassword,
    });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const path = formData.get('path') as string | null;

        if (!file || !path) {
            return NextResponse.json({ error: 'Missing file or path' }, { status: 400 });
        }
        
        const client = await getClient();
        
        // Use streaming upload
        const fileStream = file.stream();
        const remoteWriteStream = client.createWriteStream(path);

        await fileStream.pipeTo(new WritableStream({
            write(chunk) {
                return new Promise((resolve, reject) => {
                    if (!remoteWriteStream.write(chunk)) {
                        remoteWriteStream.once('drain', resolve);
                    } else {
                        resolve();
                    }
                });
            },
            close() {
                remoteWriteStream.end();
            }
        }));

        return NextResponse.json({ success: true, message: 'File uploaded successfully' });

    } catch (error: any) {
        console.error('File upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file to Nextcloud.' }, { status: 500 });
    }
}
