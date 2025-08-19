
'use server';
/**
 * @fileOverview A flow for processing videos into HLS format for secure streaming.
 * 
 * - processVideo - Handles downloading, converting, and re-uploading a video.
 * - ProcessVideoInput - The input type for the processVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { readDb, writeDb } from '@/lib/db';
import { createClient, type WebDAVClient } from 'webdav';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const ProcessVideoInputSchema = z.object({
    projectId: z.string().describe("The ID of the project being processed."),
    sourceUrl: z.string().url().describe("The public URL of the source video file."),
});
export type ProcessVideoInput = z.infer<typeof ProcessVideoInputSchema>;

async function updateProjectStatus(projectId: string, status: 'completed' | 'failed', previewUrl?: string) {
    const db = readDb();
    const projectIndex = db.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
        db.projects[projectIndex].processingStatus = status;
        if (status === 'completed' && previewUrl) {
            db.projects[projectIndex].previewVideoUrl = previewUrl;
        }
        writeDb(db);
    }
}

async function convertToHls(inputPath: string, outputDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const playlistFile = 'playlist.m3u8';
        ffmpeg(inputPath)
            .outputOptions([
                '-profile:v baseline', // baseline profile is compatible with most devices
                '-level 3.0',
                '-start_number 0',
                '-hls_time 10', // 10-second segments
                '-hls_list_size 0', // keep all segments in the playlist
                '-f hls',
            ])
            .output(path.join(outputDir, playlistFile))
            .on('end', () => resolve(playlistFile))
            .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
            .run();
    });
}

const processVideoFlow = ai.defineFlow(
    {
        name: 'processVideoFlow',
        inputSchema: ProcessVideoInputSchema,
        outputSchema: z.object({ success: z.boolean(), message: z.string() }),
    },
    async ({ projectId, sourceUrl }) => {
        const db = readDb();
        const { nextcloudUrl, nextcloudUser, nextcloudPassword } = db.settings;

        if (!nextcloudUrl || !nextcloudUser || !nextcloudPassword) {
            throw new Error("Nextcloud credentials are not configured.");
        }
        
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `proj-${projectId}-`));
        const downloadedFilePath = path.join(tempDir, 'source.mp4');
        const hlsOutputDir = path.join(tempDir, 'hls');

        try {
            await fs.mkdir(hlsOutputDir);
            
            // 1. Download the file
            console.log(`Downloading video for project ${projectId} from ${sourceUrl}`);
            const downloadUrl = (sourceUrl.includes('/s/') && !sourceUrl.endsWith('/download')) ? `${sourceUrl}/download` : sourceUrl;
            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
            const fileBuffer = Buffer.from(await response.arrayBuffer());
            await fs.writeFile(downloadedFilePath, fileBuffer);

            // 2. Convert to HLS
            console.log(`Converting video to HLS for project ${projectId}`);
            await convertToHls(downloadedFilePath, hlsOutputDir);

            // 3. Upload HLS files to Nextcloud
            const client: WebDAVClient = createClient(nextcloudUrl, {
                username: nextcloudUser,
                password: nextcloudPassword,
            });
            const nextcloudBaseDir = `/processed/${projectId}/`;
            await client.createDirectory(nextcloudBaseDir, { recursive: true });

            const filesToUpload = await fs.readdir(hlsOutputDir);
            for (const file of filesToUpload) {
                const localPath = path.join(hlsOutputDir, file);
                const remotePath = `${nextcloudBaseDir}${file}`;
                const fileContent = await fs.readFile(localPath);
                await client.putFileContents(remotePath, fileContent);
            }
            console.log(`Uploaded HLS files for project ${projectId} to ${nextcloudBaseDir}`);

            // 4. Update project status in DB
            const hlsPlaylistUrl = `${nextcloudUrl.replace('/remote.php/dav/files/', '/index.php/s/')}${await client.getPublicLink(nextcloudBaseDir + 'playlist.m3u8')}`;
            // Hacky way to construct a public URL. This is VERY dependent on Nextcloud's structure.
            // A better way would be to use the OCS Share API, but webdav client doesn't support it.
            // For now, let's assume the public link can be constructed.
            // This requires the parent `processed` folder to be publicly shared via link.
            // Let's create a more direct, but less shareable URL first.
            const directHlsUrl = `${nextcloudUrl}/${nextcloudBaseDir}playlist.m3u8`;
            const finalHlsUrl = new URL(directHlsUrl, nextcloudUrl).href;
            
            // This part is complex. The URL must be accessible by the client.
            // Let's use the WebDAV path and rely on the proxy.
            const finalPreviewUrl = `${nextcloudUrl.substring(0, nextcloudUrl.indexOf('/remote.php/dav/files/'))}${nextcloudBaseDir}playlist.m3u8`


            await updateProjectStatus(projectId, 'completed', finalPreviewUrl);
            return { success: true, message: 'Video processed successfully.' };

        } catch (error: any) {
            console.error(`Failed to process video for project ${projectId}:`, error);
            await updateProjectStatus(projectId, 'failed');
            return { success: false, message: `Error: ${error.message}` };
        } finally {
            // Clean up temporary files
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    }
);

export async function processVideo(input: ProcessVideoInput) {
    return processVideoFlow(input);
}
