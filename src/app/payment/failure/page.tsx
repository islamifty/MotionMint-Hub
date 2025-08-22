
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <div className="mx-auto">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Payment Failed</CardTitle>
          <CardDescription>
            Unfortunately, we couldn&apos;t process your payment. Please try again or contact support if the problem persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/client/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
