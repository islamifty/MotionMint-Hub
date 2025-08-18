import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">View project and payment reports.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Reporting Dashboard</CardTitle>
                    <CardDescription>
                    Client and project-specific reports will be displayed here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Reporting features are under development.</p>
                </CardContent>
            </Card>
      </div>
    );
  }
  