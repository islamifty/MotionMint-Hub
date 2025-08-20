
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
  savePipraPaySettings,
  saveBKashSettings,
  verifyNextcloudConnection,
  verifyBKashConnection,
  getSettings,
  saveGeneralSettings,
} from "./actions";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useBranding } from "@/context/BrandingContext";
import { Upload, Info, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const nextcloudSchema = z.object({
  nextcloudUrl: z.string().url({ message: "Please enter a valid URL." }),
  username: z.string().min(1, { message: "Username is required." }),
  appPassword: z.string().min(1, { message: "App Password is required." }),
});

const bKashSchema = z.object({
  bKashEnabled: z.boolean().default(false),
});

const pipraPaySchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required." }),
  piprapayBaseUrl: z.string().url({ message: "Please enter a valid Base URL." }),
  pipraPayEnabled: z.boolean().default(false),
});

const generalSchema = z.object({
    logoUrl: z.string().url("Please enter a valid image URL.").or(z.literal('')),
    primaryColor: z.string(),
    backgroundColor: z.string(),
    accentColor: z.string(),
    whatsappLink: z.string().url("Please enter a valid URL (e.g., https://wa.me/number)").or(z.literal('')),
});

type NextcloudFormValues = z.infer<typeof nextcloudSchema>;
type BKashFormValues = z.infer<typeof bKashSchema>;
type PipraPayFormValues = z.infer<typeof pipraPaySchema>;
type GeneralFormValues = z.infer<typeof generalSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isTestingNextcloud, setIsTestingNextcloud] = useState(false);
  const [isTestingBKash, setIsTestingBKash] = useState(false);
  const { branding, setBranding } = useBranding();

  const nextcloudForm = useForm<NextcloudFormValues>({
    resolver: zodResolver(nextcloudSchema),
    defaultValues: { nextcloudUrl: "", username: "", appPassword: "" },
  });

  const bKashForm = useForm<BKashFormValues>({
    resolver: zodResolver(bKashSchema),
    defaultValues: { bKashEnabled: false },
  });

  const pipraPayForm = useForm<PipraPayFormValues>({
    resolver: zodResolver(pipraPaySchema),
    defaultValues: { apiKey: "", piprapayBaseUrl: "", pipraPayEnabled: false },
  });

  const generalForm = useForm<GeneralFormValues>({
      resolver: zodResolver(generalSchema),
      defaultValues: {
          logoUrl: branding.logoUrl || '',
          primaryColor: branding.primaryColor,
          backgroundColor: branding.backgroundColor,
          accentColor: branding.accentColor,
          whatsappLink: '',
      }
  });

  useEffect(() => {
    async function loadSettings() {
        const settings = await getSettings();
        if (settings) {
            nextcloudForm.reset({
                nextcloudUrl: settings.nextcloudUrl || '',
                username: settings.nextcloudUser || '',
                appPassword: settings.nextcloudPassword || ''
            });
             bKashForm.reset({
                bKashEnabled: settings.bKashEnabled || false
            });
            pipraPayForm.reset({
                apiKey: settings.piprapayApiKey || '',
                piprapayBaseUrl: settings.piprapayBaseUrl || '',
                pipraPayEnabled: settings.pipraPayEnabled || false
            });
            generalForm.reset({
                ...generalForm.getValues(),
                whatsappLink: settings.whatsappLink || '',
                logoUrl: settings.logoUrl || '',
            });
        }
    }
    loadSettings();
  }, [nextcloudForm, bKashForm, pipraPayForm, generalForm]);

  useEffect(() => {
    generalForm.reset({
        logoUrl: branding.logoUrl || '',
        primaryColor: branding.primaryColor,
        backgroundColor: branding.backgroundColor,
        accentColor: branding.accentColor,
        whatsappLink: generalForm.getValues().whatsappLink,
    });
  }, [branding, generalForm]);

  const onNextcloudSubmit = async (data: NextcloudFormValues) => {
    const result = await saveNextcloudSettings(data);
    toast({
        title: result.success ? "Settings Saved" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
  };
  
  const onBKashSubmit = async (data: BKashFormValues) => {
    const result = await saveBKashSettings(data);
    toast({
        title: result.success ? "Settings Saved" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
  };

  const onPipraPaySubmit: SubmitHandler<PipraPayFormValues> = async (data) => {
    const result = await savePipraPaySettings(data);
    toast({
        title: result.success ? "Settings Saved" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
  };

  const onGeneralSubmit: SubmitHandler<GeneralFormValues> = async (data) => {
    let brandingUpdated = false;
    let settingsUpdated = false;
    
    try {
        const newBranding = {
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor,
            backgroundColor: data.backgroundColor,
            accentColor: data.accentColor,
        };

        if (JSON.stringify(newBranding) !== JSON.stringify(branding)) {
            setBranding(newBranding);
            brandingUpdated = true;
        }

        const generalSettingsResult = await saveGeneralSettings({ 
            whatsappLink: data.whatsappLink,
            logoUrl: data.logoUrl,
        });
        if (generalSettingsResult.success) {
            settingsUpdated = true;
        } else {
             throw new Error(generalSettingsResult.message || "Failed to save general settings.");
        }

        if (brandingUpdated || settingsUpdated) {
             toast({
                title: "Settings Saved",
                description: "Your general and branding settings have been updated.",
            });
        } else {
             toast({
                title: "No Changes",
                description: "No new settings were saved as no changes were detected.",
            });
        }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to save settings.",
        });
    }
  };

  const handleTestNextcloudConnection = async () => {
    setIsTestingNextcloud(true);
    const data = nextcloudForm.getValues();
    const result = await verifyNextcloudConnection(data);
    toast({
      title: result.success ? "Success" : "Connection Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsTestingNextcloud(false);
  };

  const handleTestBKashConnection = async () => {
    setIsTestingBKash(true);
    const result = await verifyBKashConnection();
    toast({
        title: result.success ? "Success" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    setIsTestingBKash(false);
  };

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
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="nextcloud">
          <Card>
            <Form {...nextcloudForm}>
              <form onSubmit={nextcloudForm.handleSubmit(onNextcloudSubmit)}>
                <CardHeader>
                  <CardTitle>Nextcloud Integration</CardTitle>
                  <CardDescription>
                    Enter your Nextcloud WebDAV URL and credentials to store and
                    manage project files.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={nextcloudForm.control}
                    name="nextcloudUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WebDAV URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://your-nextcloud.com/remote.php/dav/files/username"
                            {...field}
                          />
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
                          <Input placeholder="nextcloud_user" {...field} />
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
                        <FormDescription>
                          It&apos;s recommended to create a dedicated app password in
                          your Nextcloud security settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={nextcloudForm.formState.isSubmitting}
                    >
                      {nextcloudForm.formState.isSubmitting
                        ? "Saving..."
                        : "Save Nextcloud Settings"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestNextcloudConnection}
                      disabled={isTestingNextcloud}
                    >
                      {isTestingNextcloud ? "Testing..." : "Test Connection"}
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
                    Manage your bKash payment gateway settings. Credentials are in the .env file.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                      control={bKashForm.control}
                      name="bKashEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable bKash</FormLabel>
                            <FormDescription>
                              Allow clients to pay for projects using bKash.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Environment Configuration</AlertTitle>
                        <AlertDescription>
                            To configure bKash, please add the following variables to your <strong>.env</strong> file:
                            <ul className="list-disc pl-5 mt-2 text-xs">
                                <li>BKASH_APP_KEY</li>
                                <li>BKASH_APP_SECRET</li>
                                <li>BKASH_USERNAME</li>
                                <li>BKASH_PASSWORD</li>
                                <li>BKASH_MODE (set to 'sandbox' or 'production')</li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                </CardContent>
                 <CardFooter className="flex-col items-start gap-4">
                    <div className="flex gap-2">
                        <Button type="submit" disabled={bKashForm.formState.isSubmitting}>
                            {bKashForm.formState.isSubmitting ? "Saving..." : "Save bKash Settings"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleTestBKashConnection} disabled={isTestingBKash}>
                            {isTestingBKash ? "Testing..." : "Test Connection"}
                        </Button>
                    </div>
                </CardFooter>
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
                <CardContent className="space-y-6">
                   <FormField
                      control={pipraPayForm.control}
                      name="pipraPayEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable PipraPay</FormLabel>
                            <FormDescription>
                              Allow clients to pay for projects using PipraPay.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Separator />
                  <FormField
                    control={pipraPayForm.control}
                    name="piprapayBaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://pay.motionmint.top/api" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                </CardContent>
                 <CardFooter>
                    <Button type="submit" disabled={pipraPayForm.formState.isSubmitting}>
                        {pipraPayForm.formState.isSubmitting ? "Saving..." : "Save PipraPay Settings"}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)}>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Customize the look, feel, and contact information of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={generalForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custom Logo URL</FormLabel>
                            <div className="relative w-full">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input placeholder="https://example.com/logo.png" className="pl-10" {...field} />
                                </FormControl>
                            </div>
                            <FormDescription>
                                Paste a direct link to your logo image.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <FormField
                            control={generalForm.control}
                            name="primaryColor"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Primary Color</FormLabel>
                                <FormControl>
                                    <Input type="color" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={generalForm.control}
                            name="backgroundColor"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Background Color</FormLabel>
                                <FormControl>
                                    <Input type="color" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={generalForm.control}
                            name="accentColor"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Accent Color</FormLabel>
                                <FormControl>
                                    <Input type="color" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <Separator />
                     <FormField
                        control={generalForm.control}
                        name="whatsappLink"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>WhatsApp Link</FormLabel>
                            <div className="relative w-full">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                    <Input placeholder="https://wa.me/1234567890" className="pl-10" {...field} />
                                </FormControl>
                            </div>
                            <FormDescription>
                                The contact link shown to clients on the project page.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={generalForm.formState.isSubmitting}>
                        {generalForm.formState.isSubmitting ? "Saving..." : "Save General Settings"}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
