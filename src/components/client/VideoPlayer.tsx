
"use client";

function getProxyPath(directUrl: string): string {
    try {
        const url = new URL(directUrl);
        // We want the path part of the URL, but without the leading slash.
        // e.g., for "https://example.com/remote.php/dav/files/video.mp4",
        // pathname is "/remote.php/dav/files/video.mp4"
        // We slice(1) to get "remote.php/dav/files/video.mp4"
        const pathWithoutHost = url.pathname.slice(1) + url.search;
        return `/api/video/${pathWithoutHost}`;
    } catch (e) {
        console.error("Invalid URL for proxy path:", directUrl);
        return ""; // Return empty string if URL is invalid
    }
}


interface VideoPlayerProps {
    src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
    // Transform the direct Nextcloud URL into a proxied URL through our API
    const proxiedSrc = getProxyPath(src);

    return (
        <video
            src={proxiedSrc}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
