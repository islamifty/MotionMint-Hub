import Link from "next/link";
import Image from "next/image";
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
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const isExpired = new Date(project.expiryDate) < new Date();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md">
            <Image
                src={project.previewVideoUrl}
                alt={project.title}
                fill
                className="object-cover"
                data-ai-hint="video production"
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
