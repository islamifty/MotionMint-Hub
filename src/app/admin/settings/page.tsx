
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  saveNextcloudSettings,
  saveBKashSettings,
  savePipraPaySettings,
  verifyNextcloudConnection,
} from "./actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const nextcloudSchema = z.object({
  nextcloudUrl: z.string().url({ message: "Please enter a valid URL." }),
  username: z.string().min(1, { message: "Username is required." }),
  appPassword: z.string().min(1, { message: "App Password is required." }),
});

const bKashSchema = z.object({
  appKey: z.string().min(1, { message: "App Key is required." }),
  appSecret: z.string().min(1, { message: "App Secret is required." }),
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const pipraPaySchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required." }),
  apiSecret: z.string().min(1, { message: "API Secret is required." }),
});

type NextcloudFormValues = z.infer<typeof nextcloudSchema>;
type BKashFormValues = z.infer<typeof bKashSchema>;
type PipraPayFormValues = z.infer<typeof pipraPaySchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const nextcloudForm = useForm<NextcloudFormValues>({
    resolver: zodResolver(nextcloudSchema),
    defaultValues: { nextcloudUrl: "", username: "", appPassword: "" },
  });

  const bKashForm = useForm<BKashFormValues>({
    resolver: zodResolver(bKashSchema),
    defaultValues: { appKey: "", appSecret: "", username: "", password: "" },
  });

  const pipraPayForm = useForm<PipraPayFormValues>({
    resolver: zodResolver(pipraPaySchema),
    defaultValues: { apiKey: "", apiSecret: "" },
  });

  const handleSave = async (
    action: (data: any) => Promise<any>,
    data: any,
    formName: string
  ) => {
    const result = await action(data);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: `${formName} settings have been successfully updated.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save ${formName} settings. Please try again.`,
      });
    }
  };
  
  const handleTestConnection = async () => {
    const isValid = await nextcloudForm.trigger();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all Nextcloud fields before testing.",
      });
      return;
    }
    
    setIsTestingConnection(true);
    const result = await verifyNextcloudConnection(nextcloudForm.getValues());
    setIsTestingConnection(false);

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: result.message,
      });
    }
  };

  const onNextcloudSubmit: SubmitHandler<NextcloudFormValues> = (data) =>
    handleSave(saveNextcloudSettings, data, "Nextcloud");
  const onBKashSubmit: SubmitHandler<BKashFormValues> = (data) =>
    handleSave(saveBKashSettings, data, "bKash");
  const onPipraPaySubmit: SubmitHandler<PipraPayFormValues> = (data) =>
    handleSave(savePipraPaySettings, data, "PipraPay");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your integration settings and API keys.
        </p>
      </div>
      <Tabs defaultValue="nextcloud">
        <TabsList>
          <TabsTrigger value="nextcloud">Nextcloud</TabsTrigger>
          <TabsTrigger value="bkash">bKash</TabsTrigger>
          <TabsTrigger value="piprapay">PipraPay</TabsTrigger>
        </TabsList>

        <TabsContent value="nextcloud">
          <Card>
            <Form {...nextcloudForm}>
              <form onSubmit={nextcloudForm.handleSubmit(onNextcloudSubmit)}>
                <CardHeader>
                  <CardTitle>Nextcloud Integration</CardTitle>
                  <CardDescription>
                    Configure your Nextcloud WebDAV API credentials for video storage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={nextcloudForm.control}
                    name="nextcloudUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nextcloud URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://cloud.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nextcloudForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={nextcloudForm.control}
                    name="appPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={nextcloudForm.formState.isSubmitting}>
                            {nextcloudForm.formState.isSubmitting ? "Saving..." : "Save Nextcloud Settings"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTestingConnection}>
                            {isTestingConnection ? "Testing..." : "Test Connection"}
                        </Button>
                    </div>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="bkash">
          <Card>
            <Form {...bKashForm}>
              <form onSubmit={bKashForm.handleSubmit(onBKashSubmit)}>
                <CardHeader>
                  <CardTitle>bKash Payment Gateway</CardTitle>
                  <CardDescription>
                    Enter your bKash API credentials to accept payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={bKashForm.control}
                    name="appKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Key</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bKashForm.control}
                    name="appSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Secret</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bKashForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bKashForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={bKashForm.formState.isSubmitting}>
                    {bKashForm.formState.isSubmitting ? "Saving..." : "Save bKash Settings"}
                  </Button>
                </CardContent>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="piprapay">
          <Card>
            <Form {...pipraPayForm}>
              <form onSubmit={pipraPayForm.handleSubmit(onPipraPaySubmit)}>
                <CardHeader>
                  <CardTitle>PipraPay Payment Gateway</CardTitle>
                  <CardDescription>
                    Enter your PipraPay API credentials to accept payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={pipraPayForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={pipraPayForm.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Secret</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={pipraPayForm.formState.isSubmitting}>
                    {pipraPayForm.formState.isSubmitting ? "Saving..." : "Save PipraPay Settings"}
                  </Button>
                </CardContent>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
