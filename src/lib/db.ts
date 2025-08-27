
'use server';

import { kv } from '@vercel/kv';
import type { DbData } from "@/types";
import initialData from './db.json';

const DB_KEY = 'db';

export async function readDb(): Promise<DbData> {
    try {
        let dbData: any = await kv.hgetall(DB_KEY);
        
        if (!dbData || Object.keys(dbData).length === 0) {
            console.log("No data found in Vercel KV. Initializing from db.json template.");
            // Set the initial data from the JSON file into KV using hmset
            const initialDbData: DbData = initialData as DbData;
            
            // Ensure all parts of the initial data are stringified for hmset
            const preparedData: { [key: string]: string } = {
                users: JSON.stringify(initialDbData.users || []),
                clients: JSON.stringify(initialDbData.clients || []),
                projects: JSON.stringify(initialDbData.projects || []),
                settings: JSON.stringify(initialDbData.settings || {}),
            };

            await kv.hmset(DB_KEY, preparedData);
            dbData = preparedData;
        }

        // Parse the stringified values from KV
        return {
            users: dbData.users ? JSON.parse(dbData.users) : [],
            clients: dbData.clients ? JSON.parse(dbData.clients) : [],
            projects: dbData.projects ? JSON.parse(dbData.projects) : [],
            settings: dbData.settings ? JSON.parse(dbData.settings) : {},
        };

    } catch (error) {
        console.error("An unexpected error occurred while reading from Vercel KV:", error);
        // Return a safe default structure to prevent the app from crashing.
        return { users: [], clients: [], projects: [], settings: {} };
    }
}

export async function writeDb(data: DbData): Promise<void> {
    try {
        // Stringify each part of the data before writing to the hash
        const dataToWrite = {
            users: JSON.stringify(data.users || []),
            clients: JSON.stringify(data.clients || []),
            projects: JSON.stringify(data.projects || []),
            settings: JSON.stringify(data.settings || {}),
        };
        await kv.hmset(DB_KEY, dataToWrite);
    } catch (error) {
        console.error("Error writing to Vercel KV:", error);
        throw new Error("Could not write to database.");
    }
}
