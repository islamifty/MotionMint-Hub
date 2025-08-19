
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CalendarIcon, ArrowLeft, Folder, FileVideo, LinkIcon, X, ServerCrash } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import type { FileStat } from "webdav";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { addProject, getDirectoryContents } from "./actions";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { getClients } from "../../clients/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getSettings } from "../../settings/actions";


const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date({
    required_error: "An expiry date is required.",
  }),
  videoUrl: z.string().url({ message: "Please select a file or provide a valid video URL." }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nextcloudFiles, setNextcloudFiles] = useState<FileStat[]>([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [nextcloudBaseUrl, setNextcloudBaseUrl] = useState('');

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      amount: 0,
      videoUrl: ""
    },
  });

  useEffect(() => {
    async function loadInitialData() {
      const [serverClients, settings] = await Promise.all([
        getClients(),
        getSettings()
      ]);
      setClients(serverClients);
      if (settings?.nextcloudUrl) {
        // The URL from settings is the WebDAV endpoint, we need the origin for shareable links
        const url = new URL(settings.nextcloudUrl);
        setNextcloudBaseUrl(url.origin);
      }
    }
    loadInitialData();
  }, []);

  const fetchFiles = async (path: string) => {
    setIsLoadingFiles(true);
    setFileError(null);
    try {
      const files = await getDirectoryContents(path);
      setNextcloudFiles(files);
      setCurrentPath(path);
    } catch (error: any) {
      setFileError(error.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleOpenModal = () => {
    if (!nextcloudBaseUrl) {
        toast({
            variant: "destructive",
            title: "Nextcloud Not Configured",
            description: "Please configure your Nextcloud settings first.",
        });
        return;
    }
    fetchFiles('/');
    setIsModalOpen(true);
  };
  
  const handleDirectoryClick = (path: string) => {
    fetchFiles(path);
  };

  const handleFileSelect = (file: FileStat) => {
     if (!nextcloudBaseUrl) {
         console.error("Nextcloud base URL is not set.");
         toast({ variant: "destructive", title: "Configuration Error", description: "Cannot generate file URL." });
         return;
     }
     
     // This creates a WebDAV URL, which is good for admin preview but not for clients.
     // The recommended workflow is to paste a public share link for clients.
     const fullUrl = `${nextcloudBaseUrl}${file.filename}`;
     form.setValue("videoUrl", fullUrl, { shouldValidate: true });
     setIsModalOpen(false);
  }

  const handleParentDirectory = () => {
    if (currentPath === '/') return;
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    fetchFiles(parent);
  };


  const onSubmit = async (data: ProjectFormValues) => {
    const result = await addProject(data);
    
    if (result.success) {
      toast({
        title: "Project Added",
        description: "The new project has been successfully created.",
      });
      router.push("/admin/projects");
    } else {
      let errorMessage = "Failed to create project. Please try again.";
      if (typeof result.error === 'string') {
        errorMessage = result.error;
      } else if (result.error?.formErrors?.length) {
        errorMessage = result.error.formErrors.join(', ');
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="space-y-6">
       <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href="/admin/projects">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                </Link>
            </Button>
            <h1 className="text-2xl font-headline font-bold tracking-tight">Add New Project</h1>
            <p className="text-muted-foreground">Fill in the details below to create a new project.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Social Media Campaign" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Provide a detailed description of the project."
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="videoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Video</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                                <div className="relative w-full">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Paste a public shareable link here for clients" className="pl-10" {...field} />
                                </div>
                            </FormControl>
                            <Button type="button" variant="outline" onClick={handleOpenModal}>
                              <Folder className="h-4 w-4 mr-2" />
                              Browse (For Admin)
                            </Button>
                          </div>
                           <FormDescription>
                            For the best client experience, create a public share link in Nextcloud and paste it above. The browse feature uses a WebDAV link that may not be playable for clients.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Client</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Amount ($)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="2500" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expiry Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date < new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Creating..." : "Create Project"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>

       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Browse Nextcloud Files</DialogTitle>
            <DialogDescription>
              Select a video file from your Nextcloud storage. Current path: {currentPath}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {fileError ? (
                <Alert variant="destructive">
                    <ServerCrash className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{fileError}</AlertDescription>
                </Alert>
            ) : isLoadingFiles ? (
              <div className="flex justify-center items-center h-48">
                <p>Loading files...</p>
              </div>
            ) : (
              <ScrollArea className="h-72 w-full rounded-md border">
                <div className="p-4">
                   {currentPath !== '/' && (
                    <button onClick={handleParentDirectory} className="flex items-center p-2 rounded-md hover:bg-accent w-full text-left">
                      .. (Parent Directory)
                    </button>
                  )}
                  {nextcloudFiles.map((file) => (
                    <div key={file.filename}>
                      {file.type === 'directory' ? (
                        <button onClick={() => handleDirectoryClick(file.filename)} className="flex items-center p-2 rounded-md hover:bg-accent w-full text-left">
                          <Folder className="h-4 w-4 mr-2" />
                          {file.basename}
                        </button>
                      ) : (
                        <button onClick={() => handleFileSelect(file)} className="flex items-center p-2 rounded-md hover:bg-accent w-full text-left">
                          <FileVideo className="h-4 w-4 mr-2" />
                          {file.basename}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
