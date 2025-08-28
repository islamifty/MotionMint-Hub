"use server";

import { db } from '@/lib/turso';
import { projects, clients } from '@/lib/schema';
import { eq, sql, gte, and } from 'drizzle-orm';
import type { Project, StatCard as StatCardType } from "@/types";
import { unstable_noStore as noStore } from 'next/cache';

type PaymentStatus = "pending" | "paid" | "overdue";

// The data type returned by the server action. Note: It doesn't include the icon component.
type StatCardData = Omit<StatCardType, 'icon'>;

interface DashboardStats {
    statCards: StatCardData[];
    recentProjects: Project[];
    overdueProjects: Project[];
    statusCounts: Record<PaymentStatus, number>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    noStore();
    try {
        // Calculate dynamic stats
        const totalRevenueResult = await db.select({ total: sql<number>`sum(${projects.amount})` }).from(projects).where(eq(projects.paymentStatus, 'paid'));
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        const activeProjectsResult = await db.select({ count: sql<number>`count(*)` }).from(projects).where(gte(projects.expiryDate, new Date().toISOString()));
        const activeProjects = activeProjectsResult[0]?.count || 0;

        const totalClientsResult = await db.select({ count: sql<number>`count(*)` }).from(clients);
        const totalClients = totalClientsResult[0]?.count || 0;
        
        const pendingPaymentsResult = await db.select({ total: sql<number>`sum(${projects.amount})`, count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.paymentStatus, 'pending'), gte(projects.expiryDate, new Date().toISOString())));
        const pendingPayments = pendingPaymentsResult[0]?.total || 0;
        const pendingProjectsCount = pendingPaymentsResult[0]?.count || 0;
        
        const statCards: StatCardData[] = [
            { title: "Total Revenue", value: `${totalRevenue.toLocaleString()} BDT` },
            { title: "Active Projects", value: activeProjects.toString() },
            { title: "Total Clients", value: totalClients.toString() },
            { title: "Pending Payments", value: `${pendingPayments.toLocaleString()} BDT`, change: `${pendingProjectsCount} projects`, changeType: pendingProjectsCount > 0 ? "decrease" : "increase" },
        ];
        
        // Get recent projects
        const recentProjectsData = await db.select().from(projects).orderBy(sql`${projects.createdAt} DESC`).limit(5);

        // Get overdue projects
        const overdueProjectsData = await db.select().from(projects).where(eq(projects.paymentStatus, 'overdue')).orderBy(sql`${projects.expiryDate} ASC`);
          
        // Get status counts for chart
        const allProjects = await db.select({ paymentStatus: projects.paymentStatus }).from(projects);
        const statusCounts = allProjects.reduce((acc, project) => {
            const status = project.paymentStatus as PaymentStatus;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { paid: 0, pending: 0, overdue: 0 } as Record<PaymentStatus, number>);

        return {
            statCards,
            recentProjects: recentProjectsData as Project[],
            overdueProjects: overdueProjectsData as Project[],
            statusCounts,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Return empty/default state on error
        return {
            statCards: [],
            recentProjects: [],
            overdueProjects: [],
            statusCounts: { paid: 0, pending: 0, overdue: 0 },
        };
    }
}
