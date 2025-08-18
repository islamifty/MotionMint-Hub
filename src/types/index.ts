import type { LucideIcon } from "lucide-react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client" | "user";
  avatarUrl?: string;
  initials: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  previewVideoUrl: string;
  finalVideoUrl?: string;
  expiryDate: string;
  paymentStatus: "pending" | "paid" | "overdue";
  orderId: string;
  createdAt: string;
  amount: number;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company?: string;
  projectIds: string[];
  createdAt: string;
};

export type StatCard = {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: "increase" | "decrease";
};
