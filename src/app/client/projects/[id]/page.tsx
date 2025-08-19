
"use client";

import { notFound } from "next/navigation";
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
import { Download, AlertTriangle, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/client/VideoPlayer";
import type { Project } from "@/types";
import { useEffect, useState } from "react";
import { getProjectDetails, initiateBkashPayment } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const { toast } = useToast();
  const { id } = params;
  
  useEffect(() => {
    async function fetchProject() {
        const foundProject = await getProjectDetails(id);
        if (foundProject) {
            setProject(foundProject);
        }
        setLoading(false);
    }
    fetchProject();
  }, [id]);


  if (loading) {
    return (
        <div className="container py-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!project) {
    notFound();
  }

  const handleBkashPayment = async () => {
    setIsPaying(true);
    const result = await initiateBkashPayment(project.id);

    if (result.success && result.bkashURL) {
      window.location.href = result.bkashURL;
    } else {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: result.error || "Could not connect to bKash. Please try again.",
      });
      setIsPaying(false);
    }
  };

  const isExpired = new Date(project.expiryDate) < new Date();
  const isPaid = project.paymentStatus === 'paid';

  const getDirectVideoLink = (url: string) => {
    if (url.includes('/s/') && !url.endsWith('/download')) {
      return `${url}/download`;
    }
    return url;
  };
  
  const finalVideoUrl = getDirectVideoLink(project.finalVideoUrl || '');


  return (
    <div className="container py-8">
        <div className="max-w-4xl mx-auto">
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg border shadow-lg bg-black">
                <VideoPlayer videoUrl={project.previewVideoUrl} />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                     <h1 className="text-3xl font-extrabold font-headline tracking-tight text-primary">
                        {project.title}
                    </h1>
                    <h2 className="text-2xl font-bold font-headline">Project Description</h2>
                    <p className="text-muted-foreground">{project.description}</p>
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Amount Due</span>
                                <span className="text-sm font-bold">{project.amount.toLocaleString()} BDT</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Payment</span>
                                <Badge variant={isPaid ? 'default' : 'secondary'}>{project.paymentStatus}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Expires</span>
                                <span className="text-sm text-muted-foreground">{new Date(project.expiryDate).toLocaleDateString()}</span>
                            </div>
                            {isExpired && !isPaid && (
                                 <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Project Expired</span>
                                 </div>
                            )}
                        </CardContent>
                        <Separator />
                        <CardFooter className="pt-6">
                             {isPaid ? (
                                <Button className="w-full" asChild>
                                    <a href={finalVideoUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Final Video
                                    </a>
                                </Button>
                             ) : (
                                <div className="w-full space-y-2">
                                     {isExpired ? (
                                        <Button className="w-full" disabled>
                                            <AlertTriangle className="mr-2 h-4 w-4" />
                                            Payment Expired
                                        </Button>
                                     ) : (
                                        <>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled>Pay with PipraPay</Button>
                                            <Button 
                                                className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                                                onClick={handleBkashPayment}
                                                disabled={isPaying}
                                            >
                                                {isPaying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : 'Pay with bKash'}
                                            </Button>
                                        </>
                                     )}
                                </div>
                             )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}
