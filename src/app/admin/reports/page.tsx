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
import { ReportsChart } from "./ReportsChart";
import { DollarSign, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { db } from "@/lib/turso";
import { projects } from "@/lib/schema";
import { eq, sql, gte, and } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const allProjects = await db.select().from(projects);

    const totalRevenue = allProjects
        .filter(p => p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = allProjects
        .filter(p => p.paymentStatus === 'pending' || p.paymentStatus === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);
        
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const revenueThisMonth = allProjects
        .filter(p => p.paymentStatus === 'paid' && new Date(p.createdAt).getMonth() === currentMonth && new Date(p.createdAt).getFullYear() === currentYear)
        .reduce((sum, p) => sum + p.amount, 0);

    const statusCounts = allProjects.reduce((acc, project) => {
        const status = project.paymentStatus as "pending" | "paid" | "overdue";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { paid: 0, pending: 0, overdue: 0 } as Record<"pending" | "paid" | "overdue", number>);

    const chartData = [
        { name: 'Paid', value: statusCounts.paid || 0, fill: "hsl(var(--primary))" },
        { name: 'Pending', value: statusCounts.pending || 0, fill: "hsl(var(--secondary))" },
        { name: 'Overdue', value: statusCounts.overdue || 0, fill: "hsl(var(--destructive))" },
    ];

    const recentPayments = allProjects
        .filter(p => p.paymentStatus === 'paid')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-headline font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">An overview of your project and financial performance.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Revenue" value={`${totalRevenue.toLocaleString()} BDT`} icon={DollarSign} />
                <StatCard title="Revenue (This Month)" value={`${revenueThisMonth.toLocaleString()} BDT`} icon={DollarSign} />
                <StatCard title="Outstanding Amount" value={`${pendingAmount.toLocaleString()} BDT`} icon={AlertTriangle} />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Project Status Overview</CardTitle>
                        <CardDescription>A summary of all projects by their payment status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ReportsChart data={chartData} />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Payments</CardTitle>
                        <CardDescription>A list of the 10 most recently paid projects.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Date Paid</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentPayments.length > 0 ? recentPayments.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.title}</TableCell>
                                        <TableCell>{project.clientName}</TableCell>
                                        <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">{project.amount.toLocaleString()} BDT</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No recent payments found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
