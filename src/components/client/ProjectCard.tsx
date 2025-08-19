
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

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isExpired = new Date(project.expiryDate) < new Date();

  const getDirectVideoLink = (url: string) => {
    if (url.includes('/s/') && !url.endsWith('/download')) {
      return `${url}/download`;
    }
    return url;
  };

  const videoUrl = getDirectVideoLink(project.previewVideoUrl);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <video
                src={videoUrl}
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-cover bg-black"
                preload="metadata"
            />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardTitle className="font-headline text-lg">{project.title}</CardTitle>
        <div className="mt-2 flex gap-2">
            <Badge variant={project.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                {project.paymentStatus}
            </Badge>
            {isExpired && <Badge variant="destructive">Expired</Badge>}
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
