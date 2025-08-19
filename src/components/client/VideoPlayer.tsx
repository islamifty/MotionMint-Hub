
"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!src) return;

        const video = videoRef.current;
        if (!video) return;

        // Prevent right-click context menu
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        video.addEventListener('contextmenu', handleContextMenu);

        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(error => {
                    console.log("Autoplay was prevented: ", error);
                    // Autoplay is often blocked, which is fine. The user can click play.
                });
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (e.g., Safari)
            video.src = src;
            video.addEventListener('loadedmetadata', () => {
                 video.play().catch(error => {
                    console.log("Autoplay was prevented: ", error);
                });
            });
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
            video.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [src]);
    
    if (!src) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
                <div className="text-center">
                    <p className="font-semibold">Video Not Available</p>
                    <p className="text-sm text-muted-foreground">The video source could not be loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            controls
            controlsList="nodownload" // Disables the download button in some browsers
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
