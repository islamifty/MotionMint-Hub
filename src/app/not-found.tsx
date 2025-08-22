"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ClientParams() {
  const params = useSearchParams();
  const message = params?.get("message");

  return (
    <>
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </>
  );
}

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">404 - Page Not Found</CardTitle>
          <CardDescription>
            Oops! The page you are looking for does not exist or has been moved.
          </CardDescription>
          {/* Only runs client-side */}
          <Suspense fallback={null}>
            <ClientParams />
          </Suspense>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Go back to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
