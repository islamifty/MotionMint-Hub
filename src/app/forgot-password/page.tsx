
"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { sendPasswordResetNotification } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [activeTab, setActiveTab] = useState("phone");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please enter your phone number or email.",
      });
      return;
    }
    setIsLoading(true);

    const result = await sendPasswordResetNotification({ identifier });
    
    setIsLoading(false);

    if (result.success) {
      setIsSent(true);
      toast({
        title: "Check Your Inbox/Messages",
        description: `If an account with ${identifier} exists, a reset link has been sent.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not send reset link. Please try again later.",
      });
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIdentifier(""); // Reset input on tab change
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center">
        <Logo />
        <CardTitle className="pt-4 font-headline">Forgot Password</CardTitle>
        <CardDescription>
          {isSent
            ? "You can close this page now."
            : "Enter your phone or email to receive a reset link."}
        </CardDescription>
      </CardHeader>
      
      {isSent ? (
         <CardContent>
            <div className="flex flex-col items-center text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-md">
                <Mail className="h-12 w-12 text-primary mb-2" />
                <p className="font-semibold text-primary">Reset Link Sent!</p>
                <p className="text-sm text-muted-foreground">Please check your inbox or SMS messages and follow the instructions to reset your password.</p>
            </div>
         </CardContent>
      ) : (
        <form onSubmit={handleResetPassword}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="phone">Phone</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>
                <CardContent className="space-y-4 pt-6">
                    <TabsContent value="phone" className="m-0 p-0 space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="01712345678"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </TabsContent>
                    <TabsContent value="email" className="m-0 p-0 space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                        />
                    </TabsContent>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                </CardContent>
            </Tabs>
        </form>
      )}
      
      <div className="p-6 pt-0 text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </Card>
  );
}
