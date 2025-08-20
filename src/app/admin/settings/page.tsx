
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
  saveBKashSettings,
  savePipraPaySettings,
  saveSmtpSettings,
  saveSmsSettings,
  verifyNextcloudConnection,
  verifyBKashConnection,
  verifyPipraPayConnection,
  verifySmtpConnection,
  getSettings,
  saveGeneralSettings,
  verifySmsConnection,
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
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const nextcloudSchema = z.object({
  nextcloudUrl: z.string().url({ message: "Please enter a valid URL." }),
  username: z.string().min(1, { message: "Username is required." }),
  appPassword: z.string().min(1, { message: "App Password is required." }),
});

const bKashSchema = z.object({
  bKashEnabled: z.boolean().default(false),
  bKashAppKey: z.string().optional(),
  bKashAppSecret: z.string().optional(),
  bKashUsername: z.string().optional(),
  bKashPassword: z.string().optional(),
  bKashMode: z.enum(["sandbox", "production"]).default("sandbox"),
});

const pipraPaySchema = z.object({
  pipraPayEnabled: z.boolean().default(false),
  piprapayApiKey: z.string().optional(),
  piprapayBaseUrl: z.string().min(1, "Base URL is required.").optional().or(z.literal('')),
  piprapayWebhookVerifyKey: z.string().optional(),
});

const smtpSchema = z.object({
    smtpHost: z.string().min(1, "Host is required."),
    smtpPort: z.coerce.number().min(1, "Port is required."),
    smtpUser: z.string().min(1, "User is required."),
    smtpPass: z.string().min(1, "Password is required."),
});

const smsSchema = z.object({
    smsApiKey: z.string().min(1, "API Key is required."),
    smsSenderId: z.string().min(1, "Sender ID is required."),
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
type SmtpFormValues = z.infer<typeof smtpSchema>;
type SmsFormValues = z.infer<typeof smsSchema>;
type GeneralFormValues = z.infer<typeof generalSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isTestingNextcloud, setIsTestingNextcloud] = useState(false);
  const [isTestingBKash, setIsTestingBKash] = useState(false);
  const [isTestingPipraPay, setIsTestingPipraPay] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const { branding, setBranding } = useBranding();

  const nextcloudForm = useForm<NextcloudFormValues>({
    resolver: zodResolver(nextcloudSchema),
    defaultValues: { nextcloudUrl: "", username: "", appPassword: "" },
  });

  const bKashForm = useForm<BKashFormValues>({
    resolver: zodResolver(bKashSchema),
    defaultValues: { 
      bKashEnabled: false,
      bKashAppKey: "",
      bKashAppSecret: "",
      bKashUsername: "",
      bKashPassword: "",
      bKashMode: "sandbox",
    },
  });

  const pipraPayForm = useForm<PipraPayFormValues>({
    resolver: zodResolver(pipraPaySchema),
    defaultValues: { 
      pipraPayEnabled: false,
      piprapayApiKey: "",
      piprapayBaseUrl: "",
      piprapayWebhookVerifyKey: "",
    },
  });
  
  const smtpForm = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
    },
  });

  const smsForm = useForm<SmsFormValues>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
        smsApiKey: "",
        smsSenderId: "",
    }
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
                bKashEnabled: settings.bKashEnabled || false,
                bKashAppKey: settings.bKashAppKey || "",
                bKashAppSecret: settings.bKashAppSecret || "",
                bKashUsername: settings.bKashUsername || "",
                bKashPassword: settings.bKashPassword || "",
                bKashMode: settings.bKashMode || "sandbox",
            });
             pipraPayForm.reset({
                pipraPayEnabled: settings.pipraPayEnabled || false,
                piprapayApiKey: settings.piprapayApiKey || "",
                piprapayBaseUrl: settings.piprapayBaseUrl || "",
                piprapayWebhookVerifyKey: settings.piprapayWebhookVerifyKey || "",
            });
            smtpForm.reset({
                smtpHost: settings.smtpHost || "",
                smtpPort: settings.smtpPort || 587,
                smtpUser: settings.smtpUser || "",
                smtpPass: settings.smtpPass || "",
            });
            smsForm.reset({
                smsApiKey: settings.smsApiKey || "",
                smsSenderId: settings.smsSenderId || "",
            });
            generalForm.reset({
                ...generalForm.getValues(),
                whatsappLink: settings.whatsappLink || '',
                logoUrl: settings.logoUrl || '',
            });
        }
    }
    loadSettings();
  }, [nextcloudForm, bKashForm, pipraPayForm, smtpForm, smsForm, generalForm]);

  useEffect(() => {
    generalForm.reset({
        logoUrl: branding.logoUrl || '',
        primaryColor: branding.primaryColor,
        backgroundColor: branding.backgroundColor,
        accentColor: branding.accentColor,
        whatsappLink: generalForm.getValues().whatsappLink,
    });
  }, [branding, generalForm]);

  const onNextcloudSubmit: SubmitHandler<NextcloudFormValues> = async (data) => {
    const result = await saveNextcloudSettings(data);
    toast({
        title: result.success ? "Settings Saved" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
  };
  
  const onBKashSubmit: SubmitHandler<BKashFormValues> = async (data) => {
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
  
  const onSmtpSubmit: SubmitHandler<SmtpFormValues> = async (data) => {
    const result = await saveSmtpSettings(data);
    toast({
        title: result.success ? "Settings Saved" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
  };
  
  const onSmsSubmit: SubmitHandler<SmsFormValues> = async (data) => {
    const result = await saveSmsSettings(data);
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
    const data = bKashForm.getValues();
    const result = await verifyBKashConnection(data);
    toast({
        title: result.success ? "Success" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    setIsTestingBKash(false);
  };
  
   const handleTestPipraPayConnection = async () => {
    setIsTestingPipraPay(true);
    const data = pipraPayForm.getValues();
    const result = await verifyPipraPayConnection(data);
    toast({
      title: result.success ? "Success" : "Connection Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsTestingPipraPay(false);
  };
  
  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    const data = smtpForm.getValues();
    const result = await verifySmtpConnection(data);
    toast({
        title: result.success ? "Success" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    setIsTestingSmtp(false);
  };

  const handleTestSmsConnection = async () => {
    setIsTestingSms(true);
    const smsData = smsForm.getValues();
    const result = await verifySmsConnection({ ...smsData, testPhoneNumber });
     toast({
        title: result.success ? "Success" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    setIsTestingSms(false);
  }

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
        <TabsList className="flex-wrap h-auto justify-start">
          <TabsTrigger value="nextcloud">Nextcloud</TabsTrigger>
          <TabsTrigger value="bkash">bKash</TabsTrigger>
          <TabsTrigger value="piprapay">PipraPay</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="sms">SMS Gateway</TabsTrigger>
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
                      {nextcloudForm.formState.isSubmitting ? "Saving..." : "Save Nextcloud Settings"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestNextcloudConnection}
                      disabled={isTestingNextcloud}
                    >
                      {isTestingNextcloud ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
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
                    Manage your bKash payment gateway settings.
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
                    <FormField
                      control={bKashForm.control}
                      name="bKashAppKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App Key</FormLabel>
                          <FormControl><Input placeholder="Your bKash App Key" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bKashForm.control}
                      name="bKashAppSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App Secret</FormLabel>
                          <FormControl><Input type="password" placeholder="Your bKash App Secret" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={bKashForm.control}
                      name="bKashUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl><Input placeholder="Your bKash Username" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bKashForm.control}
                      name="bKashPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Your bKash Password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bKashForm.control}
                      name="bKashMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sandbox">Sandbox</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                 <CardFooter className="flex-col items-start gap-4">
                    <div className="flex gap-2">
                        <Button type="submit" disabled={bKashForm.formState.isSubmitting}>
                            {bKashForm.formState.isSubmitting ? "Saving..." : "Save bKash Settings"}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleTestBKashConnection} disabled={isTestingBKash}>
                            {isTestingBKash ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
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
                    Manage your PipraPay payment gateway settings.
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
                              Allow clients to pay using PipraPay.
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
                    <FormField
                      control={pipraPayForm.control}
                      name="piprapayApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl><Input placeholder="Your PipraPay API Key" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={pipraPayForm.control}
                      name="piprapayWebhookVerifyKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook Verification Key</FormLabel>
                          <FormControl><Input placeholder="Your Webhook Verification Key" {...field} /></FormControl>
                           <FormDescription>
                            Usually the same as your API key, unless a dedicated secret is used.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pipraPayForm.control}
                      name="piprapayBaseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base URL</FormLabel>
                          <FormControl><Input placeholder="https://sandbox.piprapay.com" {...field} /></FormControl>
                          <FormDescription>
                            Use https://sandbox.piprapay.com for testing or https://piprapay.com for production.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                 <CardFooter className="flex gap-2">
                   <Button type="submit" disabled={pipraPayForm.formState.isSubmitting}>
                     {pipraPayForm.formState.isSubmitting ? "Saving..." : "Save PipraPay Settings"}
                   </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestPipraPayConnection}
                      disabled={isTestingPipraPay}
                    >
                      {isTestingPipraPay ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="smtp">
          <Card>
            <Form {...smtpForm}>
              <form onSubmit={smtpForm.handleSubmit(onSmtpSubmit)}>
                <CardHeader>
                  <CardTitle>SMTP Settings</CardTitle>
                  <CardDescription>
                    Configure your SMTP server to send application emails.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                      control={smtpForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl><Input type="number" placeholder="587" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP User</FormLabel>
                          <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smtpForm.control}
                      name="smtpPass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Password</FormLabel>
                          <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                 <CardFooter className="flex gap-2">
                   <Button type="submit" disabled={smtpForm.formState.isSubmitting}>
                     {smtpForm.formState.isSubmitting ? "Saving..." : "Save SMTP Settings"}
                   </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestSmtpConnection}
                      disabled={isTestingSmtp}
                    >
                      {isTestingSmtp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <Form {...smsForm}>
              <form onSubmit={smsForm.handleSubmit(onSmsSubmit)}>
                <CardHeader>
                  <CardTitle>SMS Gateway Settings</CardTitle>
                  <CardDescription>
                    Configure your bdbulksms.net credentials to send SMS notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                      control={smsForm.control}
                      name="smsApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl><Input placeholder="Your bdbulksms.net API Key" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={smsForm.control}
                      name="smsSenderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender ID</FormLabel>
                          <FormControl><Input placeholder="Your Sender ID (e.g., 880xxxxxxxxx)" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                 <CardFooter>
                   <Button type="submit" disabled={smsForm.formState.isSubmitting}>
                     {smsForm.formState.isSubmitting ? "Saving..." : "Save SMS Settings"}
                   </Button>
                </CardFooter>
              </form>
            </Form>
            <Separator className="my-6" />
            <CardHeader className="pt-0">
                <CardTitle>Test SMS Connection</CardTitle>
                <CardDescription>
                    Enter a phone number to send a test message to.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="test-phone-number">Phone Number</Label>
                    <Input 
                        id="test-phone-number"
                        placeholder="e.g., 01712345678"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                 <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestSmsConnection}
                    disabled={isTestingSms || !testPhoneNumber}
                    >
                    {isTestingSms ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Test SMS"}
                </Button>
            </CardFooter>
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
