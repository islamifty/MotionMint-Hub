
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CalendarIcon, ArrowLeft, LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";

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
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { addProject } from "./actions";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import { getClients } from "../../clients/actions";


const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date({
    required_error: "An expiry date is required.",
  }),
  previewVideoUrl: z.string().url({ message: "Please provide a valid preview video URL." }),
  finalVideoUrl: z.string().url({ message: "Please provide a valid final video URL." }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      amount: 0,
      previewVideoUrl: "",
      finalVideoUrl: "",
    },
  });

  useEffect(() => {
    async function loadInitialData() {
      const serverClients = await getClients();
      setClients(serverClients);
    }
    loadInitialData();
  }, []);

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
                      name="previewVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preview Video URL</FormLabel>
                           <div className="relative w-full">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input placeholder="Paste a public shareable link for the preview video" className="pl-10" {...field} />
                                </FormControl>
                            </div>
                           <FormDescription>
                            Create a public share link in Nextcloud and paste it here for the client to preview.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="finalVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Final Video URL (for after payment)</FormLabel>
                          <div className="relative w-full">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input placeholder="Paste the public shareable link for the final downloadable video" className="pl-10" {...field} />
                            </FormControl>
                          </div>
                           <FormDescription>
                             This link will be available to the client only after successful payment.
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
                            <FormLabel>Amount (BDT)</FormLabel>
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
                <CardFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Creating..." : "Create Project"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>
    </div>
  );
}
