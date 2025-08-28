import { NextRequest, NextResponse } from 'next/server';
import { createClient, type WebDAVClient } from 'webdav';
import { db } from '@/lib/turso';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { basename } from 'path';

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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');

        if (!path) {
            return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
        }

        const client = await getClient();
        if (!(await client.exists(path))) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileContents = await client.getFileContents(path, { format: "binary" });
        const stats = await client.stat(path);

        const headers = new Headers();
        headers.set('Content-Type', stats.mime || 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${basename(stats.filename)}"`);
        headers.set('Content-Length', stats.size.toString());

        return new NextResponse(fileContents, { status: 200, headers });

    } catch (error: any) {
        console.error('File download error:', error);
        return NextResponse.json({ error: 'Failed to download file from Nextcloud.' }, { status: 500 });
    }
}
