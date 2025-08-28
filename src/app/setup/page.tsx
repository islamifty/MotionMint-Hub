"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Server, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createFirstAdmin } from "./actions";
import { Logo } from "@/components/shared/Logo";
import { checkDbConnection } from "@/lib/db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const setupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

type SetupFormValues = z.infer<typeof setupSchema>;

type ConnectionStatus = 'checking' | 'connected' | 'failed';

function ConnectionStatusIndicator({ status }: { status: ConnectionStatus }) {
    if (status === 'checking') {
        return <Skeleton className="h-5 w-48" />;
    }

    if (status === 'failed') {
        return (
            <Alert variant="destructive">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>
                   Could not connect to the database. Please check your Vercel KV configuration.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Alert>
            <Server className="h-4 w-4" />
            <AlertTitle>Database Connected</AlertTitle>
             <AlertDescription>
                Ready to create the administrator account.
            </AlertDescription>
        </Alert>
    );
}


export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');


  useEffect(() => {
    async function checkConnection() {
        const result = await checkDbConnection();
        setConnectionStatus(result.ok ? 'connected' : 'failed');
    }
    checkConnection();
  }, []);

  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SetupFormValues) => {
    setIsLoading(true);
    const result = await createFirstAdmin(data);

    if (result.success) {
      toast({
        title: "Admin Account Created",
        description: "You can now log in with your new credentials.",
      });
      router.push("/login");
    } else {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: result.error || "An unexpected error occurred.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
           <div className="mx-auto w-fit">
             <Logo />
           </div>
          <CardTitle className="mt-4 flex items-center justify-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6" />
            Welcome to MotionMint Hub Setup
          </CardTitle>
          <CardDescription>
            Please create the first administrator account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="mb-4">
             <ConnectionStatusIndicator status={connectionStatus} />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || connectionStatus !== 'connected'}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
