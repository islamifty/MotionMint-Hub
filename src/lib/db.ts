
'use server';

import fs from 'fs/promises';
import path from 'path';
import type { DbData } from "@/types";
import initialData from './db.json'; // Import the data directly

// The new path for the data directory, outside of the `src` folder.
const dataDir = path.join(process.cwd(), 'data');
// The new path for the database file.
const dbPath = path.join(dataDir, 'db.json');

// This function ensures the data directory and db.json file exist.
// If db.json doesn't exist, it copies it from the initial template.
async function ensureDbExists(): Promise<void> {
    try {
        // Ensure the 'data' directory exists.
        await fs.mkdir(dataDir, { recursive: true });
        // Check if the database file exists in the 'data' directory.
        await fs.access(dbPath);
    } catch (error: any) {
        // If the file doesn't exist (ENOENT), create it using the imported data.
        if (error.code === 'ENOENT') {
            try {
                // Use the imported JSON data to create the new file
                await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
                console.log("Database initialized in /data folder from imported template.");
            } catch (copyError) {
                console.error("Failed to create initial database in /data folder:", copyError);
                // If template writing fails, create a minimal one to prevent crashes.
                 const minimalData: DbData = {
                    users: [],
                    clients: [],
                    projects: [],
                    settings: {}
                };
                 await fs.writeFile(dbPath, JSON.stringify(minimalData, null, 2), 'utf8');
            }
        } else {
            // For other errors, rethrow.
            console.error("An unexpected error occurred while ensuring DB exists:", error);
            throw error;
        }
    }
}


export async function readDb(): Promise<DbData> {
    await ensureDbExists(); // Make sure the DB file is in place before reading.
    try {
        const fileContents = await fs.readFile(dbPath, 'utf8');
        // If the file is empty for some reason, return a default structure.
        if (!fileContents.trim()) {
            return { users: [], clients: [], projects: [], settings: {} };
        }
        return JSON.parse(fileContents);
    } catch (error) {
        console.error("An unexpected error occurred while reading the database:", error);
        // Return a safe default structure to prevent the app from crashing.
        return { users: [], clients: [], projects: [], settings: {} };
    }
}

export async function writeDb(data: DbData): Promise<void> {
    await ensureDbExists(); // Ensure directory is there before writing.
    try {
        await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
        throw new Error("Could not write to database.");
    }
}
