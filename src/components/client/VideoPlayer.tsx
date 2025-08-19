
"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Ensure src is a valid URL before proceeding
        if (!src || typeof src !== 'string') {
            console.error("Invalid src provided to VideoPlayer:", src);
            return;
        }

        let hls: Hls | null = null;

        if (src.endsWith('.m3u8')) {
            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // For Safari and other browsers that support HLS natively
                video.src = src;
            }
        } else {
            // Fallback for non-HLS videos if needed, though the goal is to use HLS
            video.src = src;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    if (!src) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="font-semibold">Processing Video</p>
                    <p className="text-sm text-muted-foreground">The video is being prepared for secure streaming. Please check back shortly.</p>
                </div>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            controls
            controlsList="nodownload" // Disables the download button
            onContextMenu={(e) => e.preventDefault()} // Prevents right-clicking
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
