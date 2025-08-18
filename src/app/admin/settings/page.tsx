import {
    Card,
    CardContent,
    CardDescription,
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
  import { Label } from "@/components/ui/label";
  import { Button } from "@/components/ui/button";
  
  export default function SettingsPage() {
    return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-headline font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your integration settings and API keys.</p>
        </div>
        <Tabs defaultValue="nextcloud">
          <TabsList>
            <TabsTrigger value="nextcloud">Nextcloud</TabsTrigger>
            <TabsTrigger value="bkash">bKash</TabsTrigger>
            <TabsTrigger value="piprapay">PipraPay</TabsTrigger>
          </TabsList>
          <TabsContent value="nextcloud">
            <Card>
              <CardHeader>
                <CardTitle>Nextcloud Integration</CardTitle>
                <CardDescription>
                  Configure your Nextcloud WebDAV API credentials for video storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nextcloud-url">Nextcloud URL</Label>
                  <Input id="nextcloud-url" placeholder="https://cloud.example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextcloud-user">Username</Label>
                  <Input id="nextcloud-user" placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextcloud-pass">App Password</Label>
                  <Input id="nextcloud-pass" type="password" />
                </div>
                <Button>Save Nextcloud Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bkash">
            <Card>
              <CardHeader>
                <CardTitle>bKash Payment Gateway</CardTitle>
                <CardDescription>
                  Enter your bKash API credentials to accept payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="bkash-key">API Key</Label>
                  <Input id="bkash-key" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bkash-secret">API Secret</Label>
                  <Input id="bkash-secret" type="password" />
                </div>
                <Button>Save bKash Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="piprapay">
            <Card>
              <CardHeader>
                <CardTitle>PipraPay Payment Gateway</CardTitle>
                <CardDescription>
                  Enter your PipraPay API credentials to accept payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="piprapay-key">API Key</Label>
                  <Input id="piprapay-key" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="piprapay-secret">API Secret</Label>
                  <Input id="piprapay-secret" type="password" />
                </div>
                <Button>Save PipraPay Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  