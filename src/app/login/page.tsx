"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { login } from './actions';

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
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success && result.redirectPath) {
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard.",
        });
        // Use window.location.href for a full page reload to ensure session is cleared
        window.location.href = result.redirectPath;
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center">
        <Logo />
        <CardTitle className="pt-4 font-headline">Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                >
                    Forgot Password?
                </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : "Login"}
          </Button>
        </CardContent>
      </form>
      <div className="p-6 pt-0 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline">
          Sign up
        </Link>
      </div>
    </Card>
  );
}
