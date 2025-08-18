// This is a simple file-based database.
// In a real-world application, you would use a proper database like PostgreSQL, MySQL, or a NoSQL database.
import fs from 'fs';
import path from 'path';
import type { Client, Project, User, AppSettings } from "@/types";

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

// Define the structure of our database
interface DbData {
    users: User[];
    clients: Client[];
    projects: Project[];
    settings: AppSettings;
}

// This is the initial data that will be written to db.json if it doesn't exist.
const initialData: DbData = {
    users: [
        {
            id: "admin-1",
            name: "Admin User",
            email: "admin@motionflow.com",
            role: "admin",
            initials: "AU",
            password: "password123",
        },
        {
            id: "client-1",
            name: "Innovate Inc.",
            email: "contact@innovate.com",
            role: "client",
            initials: "II",
            password: "password123",
        },
        {
            id: "client-2",
            name: "Solutions Co.",
            email: "hello@solutions.co",
            role: "client",
            initials: "SC",
            password: "password123",
        },
        {
            id: "user-3",
            name: "Charlie Brown",
            email: "charlie@example.com",
            role: "user",
            initials: "CB",
            password: "password123",
        },
    ],
    clients: [
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
        }
    ],
    projects: [
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
    ],
    settings: {
        nextcloudUrl: "",
        nextcloudUser: "",
        nextcloudPassword: "",
        bkashAppKey: "",
        bkashAppSecret: "",
        bkashUsername: "",
        bkashPassword: "",
    }
};

// Function to read the database file
export function readDb(): DbData {
    try {
        if (!fs.existsSync(dbPath)) {
            // If the file doesn't exist, create it with initial data
            fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        const jsonData = JSON.parse(data);
        // Ensure settings object exists
        if (!jsonData.settings) {
            jsonData.settings = initialData.settings;
        }
        return jsonData;
    } catch (error) {
        console.error("Error reading from db.json, returning initial data:", error);
        return initialData;
    }
}

// Function to write to the database file
export function writeDb(data: DbData): void {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
}
