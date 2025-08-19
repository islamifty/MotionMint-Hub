
import type { LucideIcon } from "lucide-react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client" | "user";
  avatarUrl?: string;
  initials: string;
  password?: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  previewVideoUrl: string; // This will now point to the HLS playlist (.m3u8)
  finalVideoUrl?: string; // This can remain the original MP4 for download after payment
  expiryDate: string;
  paymentStatus: "pending" | "paid" | "overdue";
  orderId: string;
  createdAt: string;
  amount: number;
  processingStatus?: 'processing' | 'completed' | 'failed';
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

export type AppSettings = {
    nextcloudUrl?: string;
    nextcloudUser?: string;
    nextcloudPassword?: string;
    bkashAppKey?: string;
    bkashAppSecret?: string;
    bkashUsername?: string;
    bkashPassword?: string;
};
