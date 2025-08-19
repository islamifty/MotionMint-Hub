
"use client";

function getProxyPath(directUrl: string): string {
    if (!directUrl) return "";
    try {
        const url = new URL(directUrl);
        // We want the path part of the URL, but without the leading slash.
        // e.g., for "https://example.com/remote.php/dav/files/video.mp4",
        // we want "remote.php/dav/files/video.mp4"
        const pathAfterHost = url.href.substring(url.origin.length + 1);
        return `/api/video/${pathAfterHost}`;
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

    if (!proxiedSrc) {
        return <div className="w-full h-full bg-black flex items-center justify-center text-white">Invalid Video URL</div>;
    }

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
