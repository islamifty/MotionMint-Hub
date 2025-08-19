
"use client";

import { useMemo } from 'react';

// This function creates a secure proxy URL for the video source.
// It takes the original Nextcloud URL and encodes it to be passed to our server-side proxy.
function getProxyUrl(originalSrc: string): string {
    if (!originalSrc) return "";
    try {
        // We encode the entire URL to ensure all special characters are handled correctly.
        const encodedUrl = encodeURIComponent(originalSrc);
        return `/api/video/proxy?url=${encodedUrl}`;
    } catch (e) {
        console.error("Failed to create proxy URL from:", originalSrc, e);
        return "";
    }
}


interface VideoPlayerProps {
    src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
    // useMemo ensures the proxy URL is calculated only when the src prop changes.
    const proxySrc = useMemo(() => getProxyUrl(src), [src]);

    if (!proxySrc) {
        return <div className="w-full h-full bg-black flex items-center justify-center text-white">Invalid Video URL</div>;
    }

    return (
        <video
            key={proxySrc} // Use key to force re-render if src changes, ensuring the player reloads with the new source.
            src={proxySrc}
            controls
            controlsList="nodownload" // Disables the download button in the browser's default video controls.
            onContextMenu={(e) => e.preventDefault()} // Prevents right-clicking on the video to access "Save video as...".
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
