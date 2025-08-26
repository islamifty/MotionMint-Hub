
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
  verifyNextcloudConnection,
  verifyBKashConnection,
  verifyPipraPayConnection,
  verifySmtpConnection,
  getSettings,
  saveGeneralSettings,
  verifySmsConnection,
  checkEnvCredentials,
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
import { Link as LinkIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

// Validation schemas for testing forms
const nextcloudTestSchema = z.object({
  nextcloudUrl: z.string().url({ message: "Please enter a valid URL." }),
  username: z.string().min(1, { message: "Username is required." }),
  appPassword: z.string().min(1, { message: "App Password is required." }),
});

const bKashTestSchema = z.object({
  bKashAppKey: z.string().min(1, "App Key is required"),
  bKashAppSecret: z.string().min(1, "App Secret is required"),
  bKashUsername: z.string().min(1, "Username is required"),
  bKashPassword: z.string().min(1, "Password is required"),
  bKashMode: z.enum(["sandbox", "production"]).default("sandbox"),
});

const pipraPayTestSchema = z.object({
  piprapayApiKey: z.string().min(1, "API Key is required"),
  piprapayBaseUrl: z.string().url("A valid URL is required"),
});

const smtpTestSchema = z.object({
    smtpHost: z.string().min(1, "Host is required."),
    smtpPort: z.coerce.number().min(1, "Port is required."),
    smtpUser: z.string().min(1, "User is required."),
    smtpPass: z.string().min(1, "Password is required."),
});

const smsTestSchema = z.object({
    greenwebSmsToken: z.string().min(1, "Token is required."),
});

const generalSchema = z.object({
    logoUrl: z.string().url("Please enter a valid image URL.").or(z.literal('')),
    primaryColor: z.string(),
    backgroundColor: z.string(),
    accentColor: z.string(),
    whatsappLink: z.string().url("Please enter a valid URL (e.g., https://wa.me/number)").or(z.literal('')),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

const StatusIndicator = ({ isConfigured }: { isConfigured: boolean }) => (
    <div className="flex items-center gap-2">
        {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
        )}
        <span className={isConfigured ? "text-green-600" : "text-destructive"}>
            {isConfigured ? "Configured via .env file" : "Not Configured"}
        </span>
    </div>
);


export default function SettingsPage() {
  const { toast } = useToast();
  const [isTestingNextcloud, setIsTestingNextcloud] = useState(false);
  const [isTestingBKash, setIsTestingBKash] = useState(false);
  const [isTestingPipraPay, setIsTestingPipraPay] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const { branding, setBranding } = useBranding();

  const [envStatus, setEnvStatus] = useState({
      nextcloud: false, bkash: false, piprapay: false, smtp: false, sms: false
  });
  
  // Test forms
  const nextcloudForm = useForm<z.infer<typeof nextcloudTestSchema>>({ resolver: zodResolver(nextcloudTestSchema), defaultValues: { nextcloudUrl: "", username: "", appPassword: "" } });
  const bKashForm = useForm<z.infer<typeof bKashTestSchema>>({ resolver: zodResolver(bKashTestSchema) });
  const pipraPayForm = useForm<z.infer<typeof pipraPayTestSchema>>({ resolver: zodResolver(pipraPayTestSchema) });
  const smtpForm = useForm<z.infer<typeof smtpTestSchema>>({ resolver: zodResolver(smtpTestSchema) });
  const smsForm = useForm<z.infer<typeof smsTestSchema>>({ resolver: zodResolver(smsTestSchema) });
  
  // General settings form
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
    async function loadInitialData() {
        const settings = await getSettings();
        const credsStatus = await checkEnvCredentials();
        setEnvStatus(credsStatus);

        if (settings) {
            generalForm.reset({
                ...generalForm.getValues(),
                whatsappLink: settings.whatsappLink || '',
                logoUrl: settings.logoUrl || '',
            });
        }
    }
    loadInitialData();
  }, [generalForm]);

  useEffect(() => {
    generalForm.reset({
        logoUrl: branding.logoUrl || '',
        primaryColor: branding.primaryColor,
        backgroundColor: branding.backgroundColor,
        accentColor: branding.accentColor,
        whatsappLink: generalForm.getValues().whatsappLink,
    });
  }, [branding, generalForm]);

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

  const handleTestNextcloudConnection = async (data: z.infer<typeof nextcloudTestSchema>) => {
    setIsTestingNextcloud(true);
    const result = await verifyNextcloudConnection(data);
    toast({
      title: result.success ? "Success" : "Connection Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsTestingNextcloud(false);
  };

  const handleTestBKashConnection = async (data: z.infer<typeof bKashTestSchema>) => {
    setIsTestingBKash(true);
    const result = await verifyBKashConnection(data);
    toast({
        title: result.success ? "Success" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    setIsTestingBKash(false);
  };
  
   const handleTestPipraPayConnection = async (data: z.infer<typeof pipraPayTestSchema>) => {
    setIsTestingPipraPay(true);
    const result = await verifyPipraPayConnection(data);
    toast({
      title: result.success ? "Success" : "Connection Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsTestingPipraPay(false);
  };
  
  const handleTestSmtpConnection = async (data: z.infer<typeof smtpTestSchema>) => {
    setIsTestingSmtp(true);
    const result = await verifySmtpConnection(data);
    toast({
        title: result.success ? "Success" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    setIsTestingSmtp(false);
  };

  const handleTestSmsConnection = async (data: z.infer<typeof smsTestSchema>) => {
    setIsTestingSms(true);
    const result = await verifySmsConnection({ ...data, testPhoneNumber });
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
          Manage your integration settings and application appearance.
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
              <form onSubmit={nextcloudForm.handleSubmit(handleTestNextcloudConnection)}>
                <CardHeader>
                  <CardTitle>Nextcloud Integration</CardTitle>
                  <CardDescription>
                    Your Nextcloud credentials must be set in your <code className="font-mono text-sm">.env</code> file. You can use this form to test your credentials.
                  </CardDescription>
                  <div className="pt-2">
                    <StatusIndicator isConfigured={envStatus.nextcloud} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={nextcloudForm.control} name="nextcloudUrl" render={({ field }) => (<FormItem><FormLabel>WebDAV URL</FormLabel><FormControl><Input placeholder="https://your-nextcloud.com/remote.php/dav/files/username" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={nextcloudForm.control} name="username" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="nextcloud_user" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={nextcloudForm.control} name="appPassword" render={({ field }) => (<FormItem><FormLabel>App Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormDescription>Use a dedicated app password from your Nextcloud security settings.</FormDescription><FormMessage /></FormItem>)} />
                </CardContent>
                <CardFooter>
                    <Button type="submit" variant="outline" disabled={isTestingNextcloud}>
                      {isTestingNextcloud ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="bkash">
          <Card>
           <Form {...bKashForm}>
              <form onSubmit={bKashForm.handleSubmit(handleTestBKashConnection)}>
                <CardHeader>
                  <CardTitle>bKash Payment Gateway</CardTitle>
                  <CardDescription>
                    Your bKash credentials must be set in your <code className="font-mono text-sm">.env</code> file. You can use this form to test your credentials.
                  </CardDescription>
                   <div className="pt-2">
                    <StatusIndicator isConfigured={envStatus.bkash} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={bKashForm.control} name="bKashAppKey" render={({ field }) => (<FormItem><FormLabel>App Key</FormLabel><FormControl><Input placeholder="Test bKash App Key" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={bKashForm.control} name="bKashAppSecret" render={({ field }) => (<FormItem><FormLabel>App Secret</FormLabel><FormControl><Input type="password" placeholder="Test bKash App Secret" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={bKashForm.control} name="bKashUsername" render={({ field }) => (<FormItem><FormLabel>Username</FormLabel><FormControl><Input placeholder="Test bKash Username" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={bKashForm.control} name="bKashPassword" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Test bKash Password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={bKashForm.control} name="bKashMode" render={({ field }) => ( <FormItem><FormLabel>Mode</FormLabel><FormControl>
                        {/* This is a simple select for the test form */}
                        <select {...field} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="sandbox">Sandbox</option><option value="production">Production</option></select>
                        </FormControl><FormMessage /></FormItem>)} />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" variant="outline" disabled={isTestingBKash}>
                        {isTestingBKash ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
                    </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="piprapay">
          <Card>
            <Form {...pipraPayForm}>
              <form onSubmit={pipraPayForm.handleSubmit(handleTestPipraPayConnection)}>
                <CardHeader>
                  <CardTitle>PipraPay Payment Gateway</CardTitle>
                  <CardDescription>
                     Your PipraPay credentials must be set in your <code className="font-mono text-sm">.env</code> file. You can use this form to test your credentials.
                  </CardDescription>
                   <div className="pt-2">
                    <StatusIndicator isConfigured={envStatus.piprapay} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={pipraPayForm.control} name="piprapayApiKey" render={({ field }) => (<FormItem><FormLabel>API Key</FormLabel><FormControl><Input placeholder="Test PipraPay API Key" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={pipraPayForm.control} name="piprapayBaseUrl" render={({ field }) => (<FormItem><FormLabel>Base URL</FormLabel><FormControl><Input placeholder="https://sandbox.piprapay.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" variant="outline" disabled={isTestingPipraPay}>
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
              <form onSubmit={smtpForm.handleSubmit(handleTestSmtpConnection)}>
                <CardHeader>
                  <CardTitle>SMTP Settings</CardTitle>
                  <CardDescription>
                    Your SMTP credentials must be set in your <code className="font-mono text-sm">.env</code> file. You can use this form to test your credentials.
                  </CardDescription>
                   <div className="pt-2">
                    <StatusIndicator isConfigured={envStatus.smtp} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={smtpForm.control} name="smtpHost" render={({ field }) => (<FormItem><FormLabel>SMTP Host</FormLabel><FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={smtpForm.control} name="smtpPort" render={({ field }) => (<FormItem><FormLabel>SMTP Port</FormLabel><FormControl><Input type="number" placeholder="587" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={smtpForm.control} name="smtpUser" render={({ field }) => (<FormItem><FormLabel>SMTP User</FormLabel><FormControl><Input placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={smtpForm.control} name="smtpPass" render={({ field }) => (<FormItem><FormLabel>SMTP Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
                 <CardFooter>
                    <Button type="submit" variant="outline" disabled={isTestingSmtp}>
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
              <form onSubmit={smsForm.handleSubmit(handleTestSmsConnection)}>
                <CardHeader>
                  <CardTitle>SMS Gateway (greenweb.com.bd)</CardTitle>
                  <CardDescription>
                    Your Greenweb token must be set in your <code className="font-mono text-sm">.env</code> file. You can use this form to test your token.
                  </CardDescription>
                   <div className="pt-2">
                    <StatusIndicator isConfigured={envStatus.sms} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={smsForm.control} name="greenwebSmsToken" render={({ field }) => (<FormItem><FormLabel>Token</FormLabel><FormControl><Input placeholder="Your test greenweb.com.bd Token" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
                <CardFooter>
                   <Button type="submit" variant="outline" disabled={smsForm.formState.isSubmitting}>
                     {smsForm.formState.isSubmitting ? "Testing..." : "Test Token"}
                   </Button>
                </CardFooter>
              </form>
            </Form>
            <Separator className="my-6" />
            <CardHeader className="pt-0">
                <CardTitle>Send Test SMS</CardTitle>
                <CardDescription>
                    Enter a phone number to send a test message to, using the token you provided above.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="test-phone-number">Phone Number</Label>
                    <Input id="test-phone-number" placeholder="e.g., 01712345678" value={testPhoneNumber} onChange={(e) => setTestPhoneNumber(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter>
                 <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleTestSmsConnection(smsForm.getValues())}
                    disabled={isTestingSms || !testPhoneNumber || !smsForm.getValues().greenwebSmsToken}
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
                  <FormField control={generalForm.control} name="logoUrl" render={({ field }) => ( <FormItem> <FormLabel>Custom Logo URL</FormLabel> <div className="relative w-full"> <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> <FormControl> <Input placeholder="https://example.com/logo.png" className="pl-10" {...field} /> </FormControl> </div> <FormDescription> Paste a direct link to your logo image. </FormDescription> <FormMessage /> </FormItem> )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <FormField control={generalForm.control} name="primaryColor" render={({ field }) => ( <FormItem> <FormLabel>Primary Color</FormLabel> <FormControl> <Input type="color" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                         <FormField control={generalForm.control} name="backgroundColor" render={({ field }) => ( <FormItem> <FormLabel>Background Color</FormLabel> <FormControl> <Input type="color" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                         <FormField control={generalForm.control} name="accentColor" render={({ field }) => ( <FormItem> <FormLabel>Accent Color</FormLabel> <FormControl> <Input type="color" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                    </div>
                    <Separator />
                     <FormField control={generalForm.control} name="whatsappLink" render={({ field }) => ( <FormItem> <FormLabel>WhatsApp Link</FormLabel> <div className="relative w-full"> <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> <FormControl> <Input placeholder="https://wa.me/1234567890" className="pl-10" {...field} /> </FormControl> </div> <FormDescription> The contact link shown to clients on the project page. </FormDescription> <FormMessage /> </FormItem> )} />
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
