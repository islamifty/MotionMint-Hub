'use server';

import fs from 'fs/promises';
import path from 'path';
import type { DbData } from "@/types";

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

// This function initializes the database with a default admin if it's empty.
async function initializeDbWithAdmin(): Promise<DbData> {
    const initialData: DbData = {
        users: [
            {
              "id": "admin-main",
              "name": "Md Iftekharul Islam",
              "email": "mdiftekharulislamifty@gmail.com",
              "phone": "01234567890",
              "role": "admin",
              "initials": "MI",
              "password": "01@*#Mdiftu" // Plain text password for debugging
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
    try {
        await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log("Database initialized with default admin data.");
        return initialData;
    } catch (error) {
        console.error("Failed to initialize database:", error);
        throw new Error("Could not initialize database.");
    }
}

export async function readDb(): Promise<DbData> {
    try {
        // Check if the file exists
        await fs.access(dbPath);
        const fileContents = await fs.readFile(dbPath, 'utf8');
        
        // If the file is empty, initialize it
        if (!fileContents) {
            console.log("Database file is empty. Initializing...");
            return await initializeDbWithAdmin();
        }

        // Try to parse the contents
        const data: DbData = JSON.parse(fileContents);
        
        // If there are no users, initialize it
        if (!data.users || data.users.length === 0) {
            console.log("No users found in database. Re-initializing...");
            return await initializeDbWithAdmin();
        }
        
        return data;
    } catch (error: any) {
        // If file doesn't exist (ENOENT) or is invalid JSON, create it
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            console.log("Database file not found or invalid. Initializing...");
            return await initializeDbWithAdmin();
        }
        // For other errors, rethrow
        console.error("An unexpected error occurred while reading the database:", error);
        throw error;
    }
}

export async function writeDb(data: DbData): Promise<void> {
    try {
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
        throw new Error("Could not write to database.");
    }
}
