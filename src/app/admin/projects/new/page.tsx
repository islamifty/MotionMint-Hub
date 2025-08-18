
"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { CalendarIcon, ArrowLeft, Upload } from "lucide-react";
import { format } from "date-fns";

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
import { clients } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required."),
  description: z.string().min(1, "Description is required."),
  clientId: z.string().min(1, "Please select a client."),
  amount: z.coerce.number().min(0, "Amount must be a positive number."),
  expiryDate: z.date({
    required_error: "An expiry date is required.",
  }),
  videoFile: z.any().refine(file => file?.length > 0, 'File is required.'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      amount: 0,
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'videoFile') {
        formData.append(key, value[0]);
      } else if (value instanceof Date) {
        formData.append(key, value.toISOString());
      }
      else {
        formData.append(key, String(value));
      }
    });

    const result = await addProject(formData);
    
    if (result.success) {
      toast({
        title: "Project Added",
        description: "The new project has been successfully created and the video uploaded.",
      });
      router.push("/admin/projects");
    } else {
      const errorMessage = result.error?.formErrors?.join(', ') || "Failed to create project. Please try again.";
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
                    name="videoFile"
                    render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                        <FormLabel>Project Video</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept="video/*"
                                    className="pl-12"
                                    onChange={(e) => {
                                        onChange(e.target.files);
                                    }}
                                    {...rest}
                                />
                                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                        </FormControl>
                        <FormDescription>
                            Upload the video file for this project.
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

            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Nextcloud Credentials</AlertTitle>
              <AlertDescription>
                Project video files will be uploaded to the Nextcloud instance configured in the <Link href="/admin/settings" className="font-bold underline">Settings</Link> page.
              </AlertDescription>
            </Alert>
            
            <Card>
                <CardFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Creating..." : "Create Project & Upload"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
      </Form>
    </div>
  );
}
