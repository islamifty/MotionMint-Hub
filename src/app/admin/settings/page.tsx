
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
  verifyNextcloudConnection,
  verifyBKashConnection,
  getSettings
} from "./actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useBranding } from "@/context/BrandingContext";
import { Upload, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const nextcloudSchema = z.object({
  nextcloudUrl: z.string().url({ message: "Please enter a valid URL." }),
  username: z.string().min(1, { message: "Username is required." }),
  appPassword: z.string().min(1, { message: "App Password is required." }),
});

const pipraPaySchema = z.object({
  apiKey: z.string().min(1, { message: "API Key is required." }),
  apiSecret: z.string().min(1, { message: "API Secret is required." }),
});

const brandingSchema = z.object({
    logo: z.any().optional(),
    primaryColor: z.string(),
    backgroundColor: z.string(),
    accentColor: z.string(),
});

type NextcloudFormValues = z.infer<typeof nextcloudSchema>;
type PipraPayFormValues = z.infer<typeof pipraPaySchema>;
type BrandingFormValues = z.infer<typeof brandingSchema>;

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isTestingNextcloud, setIsTestingNextcloud] = useState(false);
  const [isTestingBKash, setIsTestingBKash] = useState(false);
  const { branding, setBranding } = useBranding();

  const nextcloudForm = useForm<NextcloudFormValues>({
    resolver: zodResolver(nextcloudSchema),
    defaultValues: { nextcloudUrl: "", username: "", appPassword: "" },
  });

  const pipraPayForm = useForm<PipraPayFormValues>({
    resolver: zodResolver(pipraPaySchema),
    defaultValues: { apiKey: "", apiSecret: "" },
  });

  const brandingForm = useForm<BrandingFormValues>({
      resolver: zodResolver(brandingSchema),
      defaultValues: {
          logo: null,
          primaryColor: branding.primaryColor,
          backgroundColor: branding.backgroundColor,
          accentColor: branding.accentColor,
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
        }
    }
    loadSettings();
  }, [nextcloudForm]);

  useEffect(() => {
    brandingForm.reset({
        logo: null,
        primaryColor: branding.primaryColor,
        backgroundColor: branding.backgroundColor,
        accentColor: branding.accentColor,
    });
  }, [branding, brandingForm]);

  const onNextcloudSubmit = async (data: NextcloudFormValues) => {
    const result = await saveNextcloudSettings(data);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };
  
  const handleTestNextcloudConnection = async () => {
    const isValid = await nextcloudForm.trigger();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all Nextcloud fields before testing.",
      });
      return;
    }
    
    setIsTestingNextcloud(true);
    const result = await verifyNextcloudConnection(nextcloudForm.getValues());
    setIsTestingNextcloud(false);

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

  const handleTestBKashConnection = async () => {
    setIsTestingBKash(true);
    const result = await verifyBKashConnection();
    setIsTestingBKash(false);

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

  const onPipraPaySubmit: SubmitHandler<PipraPayFormValues> = async (data) =>
  {
    const result = await savePipraPaySettings(data);
    if (result.success) {
      toast({
        title: "Settings Saved",
        description: "PipraPay settings have been successfully updated.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save PipraPay settings. Please try again.",
      });
    }
  };

  const onBrandingSubmit: SubmitHandler<BrandingFormValues> = async (data) => {
    try {
        let logoUrl = branding.logo;
        const logoFile = data.logo?.[0];

        if (logoFile) {
            logoUrl = await fileToBase64(logoFile);
        }

        setBranding({
            logo: logoUrl,
            primaryColor: data.primaryColor,
            backgroundColor: data.backgroundColor,
            accentColor: data.accentColor,
        });

        toast({
            title: "Branding Saved",
            description: "Your branding settings have been updated.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save branding settings.",
        });
    }
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
          <TabsTrigger value="branding">Branding</TabsTrigger>
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
                        <Button type="button" variant="outline" onClick={handleTestNextcloudConnection} disabled={isTestingNextcloud}>
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
            <CardHeader>
              <CardTitle>bKash Payment Gateway</CardTitle>
              <CardDescription>
                Your bKash API credentials are managed in the project's .env file for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
             <CardFooter>
                <Button type="button" variant="outline" onClick={handleTestBKashConnection} disabled={isTestingBKash}>
                    {isTestingBKash ? "Testing..." : "Test Connection"}
                </Button>
            </CardFooter>
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

        <TabsContent value="branding">
          <Card>
            <Form {...brandingForm}>
              <form onSubmit={brandingForm.handleSubmit(onBrandingSubmit)}>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={brandingForm.control}
                    name="logo"
                    render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                        <FormLabel>Custom Logo</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept="image/png, image/jpeg, image/svg+xml"
                                    className="pl-12"
                                    onChange={(e) => {
                                        onChange(e.target.files);
                                    }}
                                    {...rest}
                                />
                                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <FormField
                            control={brandingForm.control}
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
                            control={brandingForm.control}
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
                            control={brandingForm.control}
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
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={brandingForm.formState.isSubmitting}>
                        {brandingForm.formState.isSubmitting ? "Saving..." : "Save Branding"}
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
