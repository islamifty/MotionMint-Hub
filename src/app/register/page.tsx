"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addNewUser, sendOtp } from "./actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/shared/Logo";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const OTPSchema = z.object({
  phone: z.string().min(11, "Please enter a valid phone number."),
});

const RegisterSchema = z.object({
  phone: z.string(),
  otp: z.string().min(6, "OTP must be 6 digits."),
  name: z.string().min(1, "Full name is required."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      phone: "",
      otp: "",
      name: "",
      email: "",
      password: "",
    },
  });

  const phone = form.watch("phone");

  const handleSendOtp = async () => {
    const phoneResult = await OTPSchema.safeParseAsync({ phone: form.getValues("phone") });
    if (!phoneResult.success) {
      form.setError("phone", { message: phoneResult.error.errors[0].message });
      return;
    }

    setIsSendingOtp(true);
    const result = await sendOtp(phone);
    setIsSendingOtp(false);

    if (result.success) {
      toast({
        title: "OTP Sent",
        description: "An OTP has been sent to your phone number.",
      });
      setStep(2);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setIsRegistering(true);
    try {
      const result = await addNewUser(data);

      if (!result.success) {
        throw new Error(result.error || "Registration failed.");
      }

      toast({
        title: "Account Created",
        description: "You have been successfully registered. Redirecting to login...",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center">
        <Logo />
        <CardTitle className="pt-4 font-headline">Create an Account</CardTitle>
        <CardDescription>
          {step === 1
            ? "Enter your phone number to begin."
            : "Enter the OTP and your details to register."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRegister)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="01712345678"
                      {...field}
                      disabled={step === 2 || isSendingOtp}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the 6-digit OTP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
              </>
            )}

            {step === 1 ? (
              <Button
                type="button"
                onClick={handleSendOtp}
                className="w-full"
                disabled={isSendingOtp || !phone}
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
