'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Trash2, Clipboard } from 'lucide-react';
import { getLogs, clearLogs } from './actions';
import { useToast } from '@/hooks/use-toast';

export default function LogsPage() {
  const [logs, setLogs] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    const logData = await getLogs();
    setLogs(logData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    setIsClearing(true);
    const result = await clearLogs();
    if (result.success) {
      toast({
        title: 'Logs Cleared',
        description: 'The log file has been successfully cleared.',
      });
      fetchLogs();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to clear logs.',
      });
    }
    setIsClearing(false);
  };

  const handleCopyLogs = async () => {
    if (!logs) {
        toast({
            variant: 'destructive',
            title: 'Nothing to Copy',
            description: 'The log file is empty.',
        });
        return;
    }
    try {
        await navigator.clipboard.writeText(logs);
        toast({
            title: 'Copied!',
            description: 'Logs have been copied to your clipboard.',
        });
    } catch (err) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not copy logs to clipboard.',
        });
    }
  };

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-2xl font-headline font-bold tracking-tight">System Logs</h1>
            <p className="text-muted-foreground">
                Review application logs for debugging and monitoring purposes.
            </p>
        </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log Viewer
            </CardTitle>
            <CardDescription>
                Showing the contents of `app-logs.log`. Newest entries are at the bottom.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCopyLogs} variant="outline" size="sm">
                <Clipboard className="mr-2 h-4 w-4" />
                Copy Logs
            </Button>
            <Button onClick={handleClearLogs} variant="destructive" size="sm" disabled={isClearing}>
              {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Clear Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-4 h-[60vh] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap break-words">
                {logs || 'Log file is empty.'}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
