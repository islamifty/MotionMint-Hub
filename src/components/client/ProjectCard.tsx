
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types";
import { VideoPlayer } from "./VideoPlayer";
import { Loader } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isExpired = new Date(project.expiryDate) < new Date();
  
  // Use the proxy for HLS streams as well to hide the Nextcloud URL
  const getProxyUrl = (originalSrc: string): string => {
    if (!originalSrc) return "";
    try {
        const encodedUrl = encodeURIComponent(originalSrc);
        return `/api/video/proxy?url=${encodedUrl}`;
    } catch (e) {
        console.error("Failed to create proxy URL from:", originalSrc, e);
        return "";
    }
  }

  const videoUrl = project.processingStatus === 'completed' && project.previewVideoUrl 
    ? getProxyUrl(project.previewVideoUrl)
    : "";


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
            <VideoPlayer src={videoUrl} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardTitle className="font-headline text-lg">{project.title}</CardTitle>
        <div className="mt-2 flex gap-2 items-center">
            <Badge variant={project.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                {project.paymentStatus}
            </Badge>
            {isExpired && <Badge variant="destructive">Expired</Badge>}
            {project.processingStatus === 'processing' && (
                <Badge variant="outline" className="flex items-center gap-1">
                    <Loader className="h-3 w-3 animate-spin" />
                    Processing
                </Badge>
            )}
             {project.processingStatus === 'failed' && (
                <Badge variant="destructive">Processing Failed</Badge>
            )}
        </div>
        <CardDescription className="mt-2 line-clamp-2">{project.description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href={`/client/projects/${project.id}`}>View Project</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
