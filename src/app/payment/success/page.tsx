
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
           <div className="mx-auto">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">Payment Successful</CardTitle>
          <CardDescription>
            Thank you for your payment! Your project has been updated. You can now access all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/client/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
