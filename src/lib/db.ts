'use server';

// This is a simple file-based database.
// In a real-world application, you would use a proper database like PostgreSQL, MySQL, or a NoSQL database.
import fs from 'fs';
import path from 'path';
import type { Client, Project, User, AppSettings, DbData } from "@/types";

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

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
        const fileContents = fs.readFileSync(dbPath, 'utf8');
        // If file is empty, initialize it
        if (!fileContents) {
            fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        const jsonData = JSON.parse(fileContents);
        // Ensure settings object exists
        if (!jsonData.settings) {
            jsonData.settings = initialData.settings;
        }
        return jsonData;
    } catch (error) {
        console.error("Critical error reading or parsing db.json:", error);
        // Return a safe, empty structure to prevent crashes
        return {
            users: [],
            clients: [],
            projects: [],
            settings: {},
        };
    }
}

// Function to write to the database file
export async function writeDb(data: DbData): Promise<void> {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
}
