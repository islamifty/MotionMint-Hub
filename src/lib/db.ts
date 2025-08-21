'use server';

import fs from 'fs/promises';
import path from 'path';
import type { DbData } from "@/types";

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

const initialData: DbData = {
    users: [
        {
          "id": "admin-main",
          "name": "Md Iftekharul Islam",
          "email": "mdiftekharulislamifty@gmail.com",
          "phone": "01234567890",
          "role": "admin",
          "initials": "MI",
          "password": "$2a$10$w1/Flf.1zJc.30u43ZSc2.q1GUKgceGf9c15/341V2W8y8Y02.WdG"
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

async function initializeDb(): Promise<void> {
    try {
        await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
        console.log("Database initialized with default data.");
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
}

export async function readDb(): Promise<DbData> {
    try {
        await fs.access(dbPath);
        const fileContents = await fs.readFile(dbPath, 'utf8');
        if (fileContents) {
            return JSON.parse(fileContents);
        }
        // If file is empty, re-initialize
        await initializeDb();
        return initialData;
    } catch (error) {
        // If file doesn't exist or is invalid JSON, create it
        console.log("Database file not found or invalid. Initializing...");
        await initializeDb();
        return initialData;
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
