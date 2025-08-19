
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
    videoUrl: string;
}

export function VideoPlayer({ videoUrl }: VideoPlayerProps) {
    const [secureUrl, setSecureUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let isMounted = true;
        
        async function fetchSecureUrl() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/video/secure-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch secure link.');
                }

                const data = await response.json();
                if (isMounted) {
                    setSecureUrl(data.secureUrl);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchSecureUrl();

        return () => {
            isMounted = false;
        };
    }, [videoUrl]);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            // Prevent right-click context menu
            const handleContextMenu = (e: MouseEvent) => e.preventDefault();
            videoElement.addEventListener('contextmenu', handleContextMenu);

            return () => {
                videoElement.removeEventListener('contextmenu', handleContextMenu);
            };
        }
    }, [secureUrl]);


    if (isLoading) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Preparing secure video...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="mt-2 font-semibold">Could not load video</p>
                <p className="text-sm text-center text-muted-foreground">{error}</p>
            </div>
        );
    }
    
    if (!secureUrl) {
         return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
                <p>Video not available.</p>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            src={secureUrl}
            controls
            controlsList="nodownload" // Disables the download button in some browsers
            className="w-full h-full object-contain"
            preload="auto"
        />
    );
}
