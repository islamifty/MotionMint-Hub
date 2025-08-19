"use client";

import { useMemo } from 'react';

// This function checks if a URL is a Nextcloud share link and appends /download if needed.
function getPlayableVideoLink(url: string): string {
    if (!url) return "";
    try {
        // Check for Nextcloud's specific share link structure
        if (url.includes('/s/') || url.includes('/index.php/s/')) {
            const urlObj = new URL(url);
            // Avoid adding /download if it's already there
            if (!urlObj.pathname.endsWith('/download')) {
                // Ensure there's no trailing slash before adding /download
                return `${url.replace(/\/$/, '')}/download`;
            }
        }
        // If it's not a share link or already has /download, return it as is.
        return url;
    } catch (e) {
        console.error("Invalid video URL:", url);
        return ""; // Return empty string for invalid URLs
    }
}

interface VideoPlayerProps {
    src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
    // Memoize the result to avoid re-calculating the URL on every render
    const playableSrc = useMemo(() => getPlayableVideoLink(src), [src]);

    if (!playableSrc) {
        return <div className="w-full h-full bg-black flex items-center justify-center text-white">Invalid Video URL</div>;
    }

    return (
        <video
            key={playableSrc} // Use key to force re-render if src changes
            src={playableSrc}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
