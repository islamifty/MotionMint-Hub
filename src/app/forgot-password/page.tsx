
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
import { sendPasswordResetLink } from "./actions";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return;
    }
    setIsLoading(true);

    const result = await sendPasswordResetLink({ email });
    
    setIsLoading(false);

    if (result.success) {
      setIsSent(true);
      toast({
        title: "Check Your Email",
        description: `If an account with ${email} exists, a password reset link has been sent.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not send reset link. Please try again later.",
      });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center">
        <Logo />
        <CardTitle className="pt-4 font-headline">Forgot Password</CardTitle>
        <CardDescription>
          {isSent
            ? "You can close this page now."
            : "Enter your email to receive a reset link."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleResetPassword}>
        <CardContent className="space-y-4">
          {isSent ? (
            <div className="flex flex-col items-center text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-md">
                <Mail className="h-12 w-12 text-primary mb-2" />
                <p className="font-semibold text-primary">Reset Link Sent!</p>
                <p className="text-sm text-muted-foreground">Please check your inbox (and spam folder) and follow the instructions to reset your password.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
          {!isSent && (
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          )}
        </CardContent>
      </form>
      <div className="p-6 pt-0 text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </Card>
  );
}
