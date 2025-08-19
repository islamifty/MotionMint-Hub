
"use client";

import React from 'react';

interface VideoPlayerProps {
    src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
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
            src={src}
            controls
            controlsList="nodownload" // Disables the download button
            onContextMenu={(e) => e.preventDefault()} // Prevents right-clicking
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
