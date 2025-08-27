
'use server';

import { kv } from '@vercel/kv';
import type { DbData } from "@/types";
import initialData from './db.json';

const DB_KEY = 'db';

export async function readDb(): Promise<DbData> {
    try {
        let dbData: DbData | null = await kv.get(DB_KEY);
        
        if (!dbData) {
            console.log("No data found in Vercel KV. Initializing from db.json template.");
            // Set the initial data from the JSON file into KV
            await kv.set(DB_KEY, initialData);
            dbData = initialData;
        }
        
        return dbData;
    } catch (error) {
        console.error("An unexpected error occurred while reading from Vercel KV:", error);
        // Return a safe default structure to prevent the app from crashing.
        return { users: [], clients: [], projects: [], settings: {} };
    }
}

export async function writeDb(data: DbData): Promise<void> {
    try {
        await kv.set(DB_KEY, data);
    } catch (error) {
        console.error("Error writing to Vercel KV:", error);
        throw new Error("Could not write to database.");
    }
}
