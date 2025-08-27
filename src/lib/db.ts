
'use server';

import { createClient } from 'redis';
import type { DbData } from "@/types";
import initialData from './db.json';

// Singleton pattern to ensure only one client is created
let redisClient: ReturnType<typeof createClient> | null = null;

async function getClient() {
    if (!redisClient) {
        if (!process.env.KV_URL) {
            throw new Error("KV_URL environment variable is not set.");
        }
        redisClient = createClient({
            url: process.env.KV_URL
        });
        redisClient.on('error', err => console.error('Redis Client Error', err));
        await redisClient.connect();
    }
    return redisClient;
}

const DB_KEY = 'db';

export async function readDb(): Promise<DbData> {
    try {
        const client = await getClient();
        let dbData: any = await client.hGetAll(DB_KEY);
        
        if (!dbData || Object.keys(dbData).length === 0) {
            console.log("No data found in Vercel KV. Initializing from db.json template.");
            const initialDbData: DbData = initialData as DbData;
            
            // Stringify each part of the initial data for hSet
            const preparedData: { [key: string]: string } = {
                users: JSON.stringify(initialDbData.users || []),
                clients: JSON.stringify(initialDbData.clients || []),
                projects: JSON.stringify(initialDbData.projects || []),
                settings: JSON.stringify(initialDbData.settings || {}),
            };

            await client.hSet(DB_KEY, preparedData);
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
        const client = await getClient();
        // Stringify each part of the data before writing to the hash
        const dataToWrite: { [key: string]: string } = {
            users: JSON.stringify(data.users || []),
            clients: JSON.stringify(data.clients || []),
            projects: JSON.stringify(data.projects || []),
            settings: JSON.stringify(data.settings || {}),
        };
        await client.hSet(DB_KEY, dataToWrite);
    } catch (error) {
        console.error("Error writing to Vercel KV:", error);
        throw new Error("Could not write to database.");
    }
}
