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
        }
    ],
    clients: [],
    projects: [],
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
