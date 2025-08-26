
import type { LucideIcon } from "lucide-react";
import type { FileStat as WebDAVFile } from "webdav";

export { WebDAVFile };

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "client" | "user";
  avatarUrl?: string;
  initials: string;
  password?: string;
  notificationSettings?: {
    newProject: boolean;
    paymentSuccess: boolean;
  };
};

export type Project = {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  previewVideoUrl: string;
  finalVideoUrl: string; 
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
  phone: string;
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
    // These settings are now read from environment variables on the server.
    // The client-side should not have direct access to these.
    // This type can be used for passing specific, safe settings to the client if needed.
    
    // General settings that are safe to expose and are stored in db.json
    whatsappLink?: string;
    logoUrl?: string;
};

// Define the structure of our database
export interface DbData {
    users: User[];
    clients: Client[];
    projects: Project[];
    settings: {
        // Only non-sensitive settings are stored here now.
        whatsappLink?: string;
        logoUrl?: string;
    };
}
