
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
import { projects } from "@/lib/data";
import type { StatCard as StatCardType } from "@/types";

const statCards: StatCardType[] = [
    { title: "Total Revenue", value: "11,200 BDT", icon: DollarSign, change: "+15.2%", changeType: "increase" },
    { title: "Active Projects", value: "3", icon: FolderKanban, change: "+2 from last month", changeType: "increase" },
    { title: "Total Clients", value: "2", icon: Users, change: "All active", changeType: "increase" },
    { title: "Pending Payments", value: "8,700 BDT", icon: CreditCard, change: "2 projects", changeType: "decrease" },
];

export default function DashboardPage() {
  const recentProjects = projects.slice(0, 5);

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
