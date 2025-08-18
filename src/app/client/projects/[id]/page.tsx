
import Image from "next/image";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
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
import { Download, CreditCard, Clock, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const db = readDb();
  const project = db.projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  const isExpired = new Date(project.expiryDate) < new Date();
  const isPaid = project.paymentStatus === 'paid';

  return (
    <div className="container py-8">
        <div className="max-w-4xl mx-auto">
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg border shadow-lg">
                <Image
                    src={project.previewVideoUrl}
                    alt={`Preview for ${project.title}`}
                    fill
                    className="object-cover"
                    data-ai-hint="video preview"
                />
                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight text-white drop-shadow-md text-center px-4">
                        {project.title}
                    </h1>
                 </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
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
                                <span className="text-sm font-medium">Payment</span>
                                <Badge variant={isPaid ? 'default' : 'secondary'}>{project.paymentStatus}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Expires</span>
                                <span className="text-sm text-muted-foreground">{new Date(project.expiryDate).toLocaleDateString()}</span>
                            </div>
                            {isExpired && (
                                 <div className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Project Expired</span>
                                 </div>
                            )}
                        </CardContent>
                        <Separator />
                        <CardFooter className="pt-6">
                             {isPaid ? (
                                <Button className="w-full" disabled={isExpired}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {isExpired ? "Download Expired" : "Download Final Video"}
                                </Button>
                             ) : (
                                <div className="w-full space-y-2">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Pay with PipraPay</Button>

                                    <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">Pay with bKash</Button>
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
