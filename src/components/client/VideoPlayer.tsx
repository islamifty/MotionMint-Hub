
"use client";

function getProxyPath(directUrl: string): string {
    try {
        const url = new URL(directUrl);
        // We want the path starting from /remote.php/... or /s/...
        // The API route will handle reconstructing the full path.
        // The [...path] in the route captures everything after /api/video/
        return `/api/video${url.pathname}${url.search}`;
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
