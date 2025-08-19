
import { DollarSign, FolderKanban, Users, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
  } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { readDb } from "@/lib/db";
import type { StatCard as StatCardType } from "@/types";

export default function DashboardPage() {
  const db = readDb();
  const recentProjects = db.projects.slice(0, 5);

  // Calculate dynamic stats
  const totalRevenue = db.projects
    .filter(p => p.paymentStatus === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const activeProjects = db.projects.filter(p => new Date(p.expiryDate) >= new Date()).length;

  const totalClients = db.clients.length;

  const pendingPayments = db.projects
    .filter(p => p.paymentStatus === 'pending' && new Date(p.expiryDate) >= new Date())
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingProjectsCount = db.projects.filter(p => p.paymentStatus === 'pending' && new Date(p.expiryDate) >= new Date()).length;

  const statCards: StatCardType[] = [
      { 
        title: "Total Revenue", 
        value: `${totalRevenue.toLocaleString()} BDT`, 
        icon: DollarSign, 
      },
      { 
        title: "Active Projects", 
        value: activeProjects.toString(), 
        icon: FolderKanban,
      },
      { 
        title: "Total Clients", 
        value: totalClients.toString(), 
        icon: Users,
      },
      { 
        title: "Pending Payments", 
        value: `${pendingPayments.toLocaleString()} BDT`, 
        icon: CreditCard,
        change: `${pendingProjectsCount} projects`,
        changeType: pendingProjectsCount > 0 ? "decrease" : "increase"
      },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">An overview of your MotionMint Hub account.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>A list of the most recently created projects.</CardDescription>
        </CardHeader>
        <CardContent>
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.clientName}</TableCell>
                  <TableCell>
                    <Badge variant={project.paymentStatus === 'paid' ? 'default' : 'secondary'}>{project.paymentStatus}</Badge>
                  </TableCell>
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
