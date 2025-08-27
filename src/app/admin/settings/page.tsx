
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
  getSettings,
  saveGeneralSettings,
  saveNextcloudSettings,
  saveBKashSettings,
  savePipraPaySettings,
  saveSmtpSettings,
  saveSmsSettings,
  verifyNextcloudConnection,
  verifyBKashConnection,
  verifyPipraPayConnection,
  verifySmtpConnection,
  verifySmsConnection,
  checkDbCredentials,
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
import { Link as LinkIcon, Loader2, CheckCircle, AlertCircle, Save, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppSettings } from "@/types";

// Schema for the entire form, allowing empty strings for URLs
const settingsSchema = z.object({
    // Nextcloud
    nextcloudUrl: z.string().url({ message: "Must be a valid URL." }).or(z.literal('')),
    nextcloudUser: z.string().optional(),
    nextcloudPassword: z.string().optional(),
    // bKash
    bKashAppKey: z.string().optional(),
    bKashAppSecret: z.string().optional(),
    bKashUsername: z.string().optional(),
    bKashPassword: z.string().optional(),
    bKashMode: z.enum(["sandbox", "production"]).default("sandbox"),
    // PipraPay
    piprapayApiKey: z.string().optional(),
    piprapayBaseUrl: z.string().url({ message: "Must be a valid URL." }).or(z.literal('')),
    piprapayWebhookVerifyKey: z.string().optional(),
    // SMTP
    smtpHost: z.string().optional(),
    smtpPort: z.coerce.number().optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    // SMS
    greenwebSmsToken: z.string().optional(),
    // General
    logoUrl: z.string().url("Please enter a valid image URL.").or(z.literal('')),
    whatsappLink: z.string().url("Please enter a valid URL.").or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;
type SectionType = 'general' | 'nextcloud' | 'bkash' | 'piprapay' | 'smtp' | 'sms';

const StatusIndicator = ({ isConfigured }: { isConfigured: boolean }) => (
    <div className="flex items-center gap-2">
        {isConfigured ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
        )}
        <span className={isConfigured ? "text-green-600" : "text-destructive"}>
            {isConfigured ? "Configured" : "Not Configured"}
        </span>
    </div>
);

const PasswordInput = ({ field, placeholder }: { field: any, placeholder?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <FormControl>
                <Input type={isVisible ? 'text' : 'password'} placeholder={placeholder} {...field} />
            </FormControl>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                onClick={() => setIsVisible(!isVisible)}
            >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    );
};


export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const { setBranding } = useBranding();
  const [dbStatus, setDbStatus] = useState({
      nextcloud: false, bkash: false, piprapay: false, smtp: false, sms: false
  });
  
  const form = useForm<SettingsFormValues>({
      resolver: zodResolver(settingsSchema),
      defaultValues: {
        nextcloudUrl: '', nextcloudUser: '', nextcloudPassword: '',
        bKashAppKey: '', bKashAppSecret: '', bKashUsername: '', bKashPassword: '', bKashMode: 'sandbox',
        piprapayApiKey: '', piprapayBaseUrl: '', piprapayWebhookVerifyKey: '',
        smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
        greenwebSmsToken: '',
        logoUrl: '',
        whatsappLink: '',
      }
  });

  useEffect(() => {
    async function loadInitialData() {
        setIsLoading(true);
        const settings = await getSettings();
        const credsStatus = await checkDbCredentials();
        setDbStatus(credsStatus);
        
        if (settings) {
            form.reset({
                ...form.getValues(),
                ...settings
            });
        }
        setIsLoading(false);
    }
    loadInitialData();
  }, [form]);


  const handleSave: SubmitHandler<SettingsFormValues> = async (data) => {
    const activeTab = document.querySelector('[data-state="active"]')?.getAttribute('data-value') as SectionType | undefined;
    if (!activeTab) return;

    let result;
    const sectionData = form.getValues();

    switch (activeTab) {
        case 'nextcloud': result = await saveNextcloudSettings(sectionData); break;
        case 'bkash': result = await saveBKashSettings(sectionData); break;
        case 'piprapay': result = await savePipraPaySettings(sectionData); break;
        case 'smtp': result = await saveSmtpSettings(sectionData); break;
        case 'sms': result = await saveSmsSettings(sectionData); break;
        case 'general': 
            result = await saveGeneralSettings(sectionData);
            if (result.success && sectionData.logoUrl) {
                setBranding({ logoUrl: sectionData.logoUrl });
            }
            break;
        default: return;
    }

    toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    if (result.success) {
        const credsStatus = await checkDbCredentials();
        setDbStatus(credsStatus);
    }
  };

  const handleTestConnection = async (type: string) => {
    setIsTesting(type);
    let result;
    const formData = form.getValues();
    switch (type) {
      case 'nextcloud': result = await verifyNextcloudConnection(formData); break;
      case 'bkash': result = await verifyBKashConnection(formData); break;
      case 'piprapay': result = await verifyPipraPayConnection(formData); break;
      case 'smtp': result = await verifySmtpConnection(formData); break;
      case 'sms': result = await verifySmsConnection(formData, testPhoneNumber); break;
      default: return;
    }
    toast({
      title: result.success ? "Success" : "Connection Failed",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    setIsTesting(null);
  };
  
  const renderCard = (
    title: string, 
    description: string, 
    statusKey: keyof typeof dbStatus | null,
    testKey: string | null,
    fields: React.ReactNode
  ) => (
     <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {statusKey && <div className="pt-2"><StatusIndicator isConfigured={dbStatus[statusKey]} /></div>}
        </CardHeader>
        <CardContent className="space-y-6">{fields}</CardContent>
        <CardFooter className="gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2" /> Save {title.split(' ')[0]} Settings</>}
            </Button>
            {testKey && (
            <Button type="button" onClick={() => handleTestConnection(testKey)} variant="outline" disabled={!!isTesting}>
                {isTesting === testKey ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : `Test ${title.split(' ')[0]} Connection`}
            </Button>
            )}
        </CardFooter>
     </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your integration settings and application appearance.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)}>
            <Tabs defaultValue="general">
                <TabsList className="flex-wrap h-auto justify-start">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="nextcloud">Nextcloud</TabsTrigger>
                    <TabsTrigger value="bkash">bKash</TabsTrigger>
                    <TabsTrigger value="piprapay">PipraPay</TabsTrigger>
                    <TabsTrigger value="smtp">SMTP</TabsTrigger>
                    <TabsTrigger value="sms">SMS Gateway</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    {renderCard("General & Branding", "Customize the look, feel, and contact information.", null, null, (
                        <>
                            <FormField control={form.control} name="logoUrl" render={({ field }) => ( 
                                <FormItem> 
                                    <FormLabel>Custom Logo URL</FormLabel> 
                                     <div className="relative flex items-center">
                                        <LinkIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="https://example.com/logo.png" className="pl-10" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormDescription> Paste a direct link to your logo image. </FormDescription> 
                                    <FormMessage /> 
                                </FormItem> 
                            )} />
                            <Separator />
                            <FormField control={form.control} name="whatsappLink" render={({ field }) => ( 
                                <FormItem> 
                                    <FormLabel>WhatsApp Link</FormLabel> 
                                    <div className="relative flex items-center">
                                        <LinkIcon className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                        <FormControl>
                                            <Input placeholder="https://wa.me/1234567890" className="pl-10" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormDescription> The contact link shown to clients on the project page. </FormDescription> 
                                    <FormMessage /> 
                                </FormItem> 
                            )} />
                        </>
                    ))}
                </TabsContent>
                <TabsContent value="nextcloud">
                    {renderCard("Nextcloud Integration", "Configure your Nextcloud instance for file management.", 'nextcloud', 'nextcloud', (
                        <>
                            <FormField control={form.control} name="nextcloudUrl" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>WebDAV URL</FormLabel><FormControl><Input placeholder="https://your-nextcloud.com/remote.php/dav/files/username" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="nextcloudUser" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Username</FormLabel><FormControl><Input placeholder="nextcloud_user" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="nextcloudPassword" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>App Password</FormLabel><PasswordInput field={field} /><FormDescription>Use a dedicated app password from your Nextcloud security settings.</FormDescription><FormMessage /></FormItem>)} />
                        </>
                    ))}
                </TabsContent>
                <TabsContent value="bkash">
                    {renderCard("bKash Gateway", "Configure bKash Tokenized Checkout credentials.", 'bkash', 'bkash', (
                        <>
                            <FormField control={form.control} name="bKashAppKey" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>App Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="bKashAppSecret" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>App Secret</FormLabel><PasswordInput field={field} /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="bKashUsername" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="bKashPassword" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Password</FormLabel><PasswordInput field={field} /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="bKashMode" render={({ field }) => ( <FormItem className="space-y-2"><FormLabel>Mode</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger></FormControl><SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        </>
                    ))}
                </TabsContent>
                <TabsContent value="piprapay">
                    {renderCard("PipraPay Gateway", "Configure your PipraPay credentials.", 'piprapay', 'piprapay', (
                         <>
                            <FormField control={form.control} name="piprapayApiKey" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>API Key</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="piprapayBaseUrl" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Base URL</FormLabel><FormControl><Input placeholder="https://sandbox.piprapay.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="piprapayWebhookVerifyKey" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Webhook Verification Key</FormLabel><PasswordInput field={field} /><FormDescription>A secret key to verify incoming webhooks from PipraPay.</FormDescription><FormMessage /></FormItem>)} />
                        </>
                    ))}
                </TabsContent>
                <TabsContent value="smtp">
                    {renderCard("SMTP Settings", "Configure your SMTP server for sending emails.", 'smtp', 'smtp', (
                        <>
                            <FormField control={form.control} name="smtpHost" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>SMTP Host</FormLabel><FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="smtpPort" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>SMTP Port</FormLabel><FormControl><Input type="number" placeholder="587" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="smtpUser" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>SMTP User</FormLabel><FormControl><Input placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="smtpPass" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>SMTP Password</FormLabel><PasswordInput field={field} placeholder="••••••••" /><FormMessage /></FormItem>)} />
                        </>
                    ))}
                </TabsContent>
                <TabsContent value="sms">
                    {renderCard("SMS Gateway", "Configure Greenweb SMS gateway for sending notifications.", 'sms', null, (
                        <>
                            <FormField control={form.control} name="greenwebSmsToken" render={({ field }) => (<FormItem className="space-y-2"><FormLabel>Token</FormLabel><PasswordInput field={field} placeholder="Your greenweb.com.bd Token" /><FormMessage /></FormItem>)} />
                             <Separator className="my-6" />
                            <div className="space-y-2">
                                <Label htmlFor="test-phone-number">Test Phone Number</Label>
                                <Input id="test-phone-number" placeholder="e.g., 01712345678" value={testPhoneNumber} onChange={(e) => setTestPhoneNumber(e.target.value)} />
                                <FormDescription>Enter a number to send a test SMS to.</FormDescription>
                                 <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleTestConnection('sms')}
                                    disabled={!!isTesting || !testPhoneNumber}
                                    className="mt-2"
                                    >
                                    {isTesting === 'sms' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Test SMS"}
                                </Button>
                            </div>
                        </>
                    ))}
                </TabsContent>
            </Tabs>
        </form>
      </Form>
    </div>
  );
}

    