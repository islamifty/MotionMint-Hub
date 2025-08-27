"use server";

import { readDb } from "@/lib/db";
import type { Project, StatCard as StatCardType } from "@/types";
import { DollarSign, FolderKanban, Users, CreditCard, AlertTriangle } from "lucide-react";

type PaymentStatus = "pending" | "paid" | "overdue";

interface DashboardStats {
    statCards: StatCardType[];
    recentProjects: Project[];
    overdueProjects: Project[];
    statusCounts: Record<PaymentStatus, number>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const db = await readDb();

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
        { title: "Total Revenue", value: `${totalRevenue.toLocaleString()} BDT`, icon: DollarSign },
        { title: "Active Projects", value: activeProjects.toString(), icon: FolderKanban },
        { title: "Total Clients", value: totalClients.toString(), icon: Users },
        { title: "Pending Payments", value: `${pendingPayments.toLocaleString()} BDT`, icon: CreditCard, change: `${pendingProjectsCount} projects`, changeType: pendingProjectsCount > 0 ? "decrease" : "increase" },
    ];
    
    // Get recent projects
    const recentProjects = db.projects.slice(0, 5);

    // Get overdue projects
    const overdueProjects = db.projects
      .filter(p => p.paymentStatus === 'overdue')
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
      
    // Get status counts for chart
    const statusCounts = db.projects.reduce((acc, project) => {
        acc[project.paymentStatus] = (acc[project.paymentStatus] || 0) + 1;
        return acc;
    }, { paid: 0, pending: 0, overdue: 0 } as Record<PaymentStatus, number>);


    return {
        statCards,
        recentProjects,
        overdueProjects,
        statusCounts,
    };
}
