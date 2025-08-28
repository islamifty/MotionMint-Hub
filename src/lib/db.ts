'use server';

import { createClient } from 'redis';
import type { DbData } from '@/types';
import initialData from './db.json';

// Singleton pattern to ensure only one client is created
let redisClient: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (!redisClient) {
    if (!process.env.KV_URL) {
      console.error('KV_URL environment variable is not set.');
      throw new Error('KV_URL environment variable is not set.');
    }
    redisClient = createClient({
      url: process.env.KV_URL,
    });
    redisClient.on('error', (err) =>
      console.error('Redis Client Error', err)
    );
    // Do not connect here immediately, connect on first use or in a dedicated connect function
  }
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
       console.error('Failed to connect to Redis:', error);
       // Reset client on connection failure to allow retries
       redisClient = null; 
       throw error;
    }
  }
  return redisClient;
}

const DB_KEY = 'db';

export async function checkDbConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
        const client = await getClient();
        const response = await client.ping();
        if (response === 'PONG') {
            return { ok: true };
        }
        return { ok: false, error: 'Ping command did not return PONG.' };
    } catch (error: any) {
        console.error('Database connection check failed:', error);
        return { ok: false, error: error.message || 'An unknown error occurred during connection check.' };
    }
}


export async function readDb(): Promise<DbData> {
  try {
    const client = await getClient();
    let dbData = await client.hGetAll(DB_KEY);

    if (!dbData || Object.keys(dbData).length === 0) {
      console.log(
        'No data found in Vercel KV. Initializing from db.json template.'
      );
      const initialDbData: DbData = initialData as DbData;

      const preparedData: { [key: string]: string } = {
        users: JSON.stringify(initialDbData.users || []),
        clients: JSON.stringify(initialDbData.clients || []),
        projects: JSON.stringify(initialDbData.projects || []),
        settings: JSON.stringify(initialDbData.settings || {}),
      };

      await client.hSet(DB_KEY, preparedData);
      dbData = preparedData;
    }

    return {
      users: dbData.users ? JSON.parse(dbData.users) : [],
      clients: dbData.clients ? JSON.parse(dbData.clients) : [],
      projects: dbData.projects ? JSON.parse(dbData.projects) : [],
      settings: dbData.settings ? JSON.parse(dbData.settings) : {},
    };
  } catch (error) {
    console.error('An unexpected error occurred while reading from Vercel KV:', error);
    return initialData as DbData;
  }
}

export async function writeDb(data: DbData): Promise<void> {
  try {
    const client = await getClient();
    const dataToWrite: { [key: string]: string } = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, JSON.stringify(value)])
    );
    await client.hSet(DB_KEY, dataToWrite);
  } catch (error) {
    console.error('Error writing to Vercel KV:', error);
    throw new Error('Could not write to database.');
  }
}
