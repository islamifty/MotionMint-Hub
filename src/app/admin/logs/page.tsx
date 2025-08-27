
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold tracking-tight">
          System Logs
        </h1>
        <p className="text-muted-foreground">
          Review application logs for debugging and monitoring purposes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Log Viewer
              </CardTitle>
              <CardDescription>
                Application logs are now managed by your hosting provider.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-6 h-auto text-center space-y-4">
            <p className="text-lg">
              File-based logging is disabled for compatibility with serverless
              environments.
            </p>
            <p className="text-muted-foreground">
              Please use your hosting provider's integrated logging solution to
              view real-time and historical logs for your application.
            </p>
            <Button asChild>
              <a
                href="https://vercel.com/docs/observability/logs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Learn about Vercel Logs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
