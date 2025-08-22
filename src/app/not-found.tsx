"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

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
