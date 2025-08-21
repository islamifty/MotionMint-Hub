
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const amount = searchParams.get("amount");
  const transactionId = searchParams.get("transactionId");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your payment. Your project has been updated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <strong>{amount ? `${Number(amount).toLocaleString()} BDT` : 'N/A'}</strong>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-muted-foreground">Transaction ID</span>
              <strong>{transactionId || 'N/A'}</strong>
            </div>
          </div>
          {projectId && (
            <Button asChild className="w-full">
              <Link href={`/client/projects/${projectId}`}>
                Go to Your Project
              </Link>
            </Button>
          )}
           <Button asChild variant="outline" className="w-full">
              <Link href="/client/dashboard">
                Back to Dashboard
              </Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
    return (
         <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <PaymentSuccessContent />
        </Suspense>
    )
}

    