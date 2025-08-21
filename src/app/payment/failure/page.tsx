
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "An unknown error occurred.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Payment Failed</CardTitle>
          <CardDescription>
            Unfortunately, your payment could not be processed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong>Reason:</strong> {message}
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/client/dashboard">
              Go back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailurePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PaymentFailureContent />
        </Suspense>
    )
}

    