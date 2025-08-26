
"use client";

import { notFound, useParams } from "next/navigation";
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
import { Download, AlertTriangle, Loader2, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/client/VideoPlayer";
import type { Project, User, AppSettings } from "@/types";
import { useEffect, useState } from "react";
import { getProjectDetails, initiateBkashPayment, initiatePipraPayPayment } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { getSettings } from "@/app/admin/settings/actions";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'piprapay' | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!id) return;
    async function fetchProject() {
        const [projectData, pageSettings] = await Promise.all([
             getProjectDetails(id),
             getSettings() // Fetch settings from the server action
        ]);

        if (projectData.project && projectData.user) {
            setProject(projectData.project);
            setUser(projectData.user);
            setSettings(pageSettings);
        }
        setLoading(false);
    }
    fetchProject();
  }, [id]);


  if (loading) {
    return (
        <div className="container py-8 flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!project || !user) {
    notFound();
  }

  const handlePayment = async (method: 'bkash' | 'piprapay') => {
    setIsPaying(true);
    setPaymentMethod(method);

    let result;
    if (method === 'bkash') {
        result = await initiateBkashPayment(project.id);
    } else {
        result = await initiatePipraPayPayment(project, user);
    }
    
    if (result.success && result.paymentURL) {
      window.location.href = result.paymentURL;
    } else {
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: result.error || `Could not connect to ${method}. Please try again.`,
      });
      setIsPaying(false);
      setPaymentMethod(null);
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
                                            {settings?.piprapayApiKey && (
                                                <Button 
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                                                    onClick={() => handlePayment('piprapay')}
                                                    disabled={isPaying}
                                                >
                                                    {isPaying && paymentMethod === 'piprapay' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : 'Pay with PipraPay'}
                                                </Button>
                                            )}
                                             {settings?.bKashAppKey && (
                                                <Button 
                                                    className="w-full bg-pink-500 hover:bg-pink-600 text-white" 
                                                    onClick={() => handlePayment('bkash')}
                                                    disabled={isPaying}
                                                >
                                                    {isPaying && paymentMethod === 'bkash' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : 'Pay with bKash'}
                                                </Button>
                                             )}
                                        </>
                                     )}
                                     {settings?.whatsappLink && (
                                         <>
                                            <Separator className="my-4" />
                                            <Button variant="outline" className="w-full" asChild>
                                                <a href={settings.whatsappLink} target="_blank" rel="noopener noreferrer">
                                                    <MessageSquare className="mr-2 h-4 w-4" />
                                                    Contact via WhatsApp
                                                </a>
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
