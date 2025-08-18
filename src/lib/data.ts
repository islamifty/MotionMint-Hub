import type { Client, Project, User } from "@/types";

// This file now only contains mock data for clients and projects.
// The user data is now managed in Firestore.

export const clients: Client[] = [
  {
    id: "client-1",
    name: "Innovate Inc.",
    email: "contact@innovate.com",
    company: "Innovate Inc.",
    projectIds: ["proj-1", "proj-3"],
    createdAt: "2023-10-26T10:00:00Z",
  },
  {
    id: "client-2",
    name: "Solutions Co.",
    email: "hello@solutions.co",
    company: "Solutions Co.",
    projectIds: ["proj-2"],
    createdAt: "2023-11-15T14:30:00Z",
  },
];

export const projects: Project[] = [
  {
    id: "proj-1",
    title: "Product Launch Video",
    description: "An exciting promotional video for our new product, 'InnovateX'. This video should be fast-paced and energetic, highlighting the key features and benefits. The target audience is tech enthusiasts.",
    clientId: "client-1",
    clientName: "Innovate Inc.",
    previewVideoUrl: "https://placehold.co/1280x720.png",
    finalVideoUrl: "https://placehold.co/1920x1080.png",
    expiryDate: "2024-08-30T23:59:59Z",
    paymentStatus: "paid",
    orderId: "ORD-2024-001",
    createdAt: "2024-06-01T10:00:00Z",
    amount: 2500,
  },
  {
    id: "proj-2",
    title: "Corporate Training Series",
    description: "A series of 5 training videos for new employees at Solutions Co. The tone should be professional and informative. Each video will cover a different aspect of the company culture and workflow.",
    clientId: "client-2",
    clientName: "Solutions Co.",
    previewVideoUrl: "https://placehold.co/1280x720.png",
    finalVideoUrl: "https://placehold.co/1920x1080.png",
    expiryDate: "2024-09-15T23:59:59Z",
    paymentStatus: "pending",
    orderId: "ORD-2024-002",
    createdAt: "2024-06-10T11:20:00Z",
    amount: 7500,
  },
  {
    id: "proj-3",
    title: "Social Media Ad Campaign",
    description: "A short, catchy ad for social media platforms to promote Innovate Inc.'s summer sale. The video needs to be optimized for mobile viewing and have clear call-to-actions.",
    clientId: "client-1",
    clientName: "Innovate Inc.",
    previewVideoUrl: "https://placehold.co/1080x1920.png",
    finalVideoUrl: "https://placehold.co/1080x1920.png",
    expiryDate: "2024-07-20T23:59:59Z",
    paymentStatus: "overdue",
    orderId: "ORD-2024-003",
    createdAt: "2024-06-15T16:45:00Z",
    amount: 1200,
  },
  {
    id: "proj-4",
    title: "Expired Project Example",
    description: "This is an example of a project whose download link has expired.",
    clientId: "client-2",
    clientName: "Solutions Co.",
    previewVideoUrl: "https://placehold.co/1280x720.png",
    finalVideoUrl: "https://placehold.co/1920x1080.png",
    expiryDate: "2023-01-01T23:59:59Z",
    paymentStatus: "paid",
    orderId: "ORD-2023-004",
    createdAt: "2022-12-01T09:00:00Z",
    amount: 3000,
  },
];
