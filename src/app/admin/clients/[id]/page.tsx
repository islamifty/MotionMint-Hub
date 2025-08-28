import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/turso";
import { clients, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  const clientResult = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  const client = clientResult[0];
  
  if (!client) {
    notFound();
  }
  
  const clientProjects = await db.select().from(projects).where(eq(projects.clientId, client.id));

  return (
    <div className="space-y-6">
        <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href="/admin/clients">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Clients
                </Link>
            </Button>
            <h1 className="text-2xl font-headline font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground">{client.email}</p>
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Project History</CardTitle>
          <CardDescription>
            A list of all projects associated with {client.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.paymentStatus}</Badge>
                  </TableCell>
                  <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{project.amount.toLocaleString()} BDT</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
