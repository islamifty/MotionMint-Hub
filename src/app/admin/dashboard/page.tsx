"use client";

import { useEffect, useState } from "react";
import { DollarSign, FolderKanban, Users, CreditCard, AlertTriangle } from "lucide-react";
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
import { ProjectStatusChart } from "./ProjectStatusChart";
import { getDashboardStats } from "./actions";
import type { Project, StatCard as StatCardType } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

type PaymentStatus = "pending" | "paid" | "overdue";

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCardType[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [overdueProjects, setOverdueProjects] = useState<Project[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<PaymentStatus, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getDashboardStats();
      setStats(data.statCards);
      setRecentProjects(data.recentProjects);
      setOverdueProjects(data.overdueProjects);
      setStatusCounts(data.statusCounts);
      setLoading(false);
    }
    loadData();
  }, []);

  const chartData = statusCounts ? [
      { name: 'Paid', value: statusCounts.paid, fill: "hsl(var(--primary))" },
      { name: 'Pending', value: statusCounts.pending, fill: "hsl(var(--secondary))" },
      { name: 'Overdue', value: statusCounts.overdue, fill: "hsl(var(--destructive))" },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">An overview of your MotionMint Hub account.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ProjectStatusChart data={chartData} />
        </div>
        <div className="lg:col-span-2">
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
      </div>

      {overdueProjects.length > 0 && (
         <Card>
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-destructive">Overdue Projects</CardTitle>
            </div>
            <CardDescription>These projects have passed their expiry date and are unpaid.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Expired</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.clientName}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(project.expiryDate), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">{project.amount.toLocaleString()} BDT</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
