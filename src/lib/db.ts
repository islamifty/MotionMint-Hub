'use server';

import { createClient } from 'redis';
import type { DbData } from '@/types';
import initialData from './db.json';
import fs from 'fs/promises';
import path from 'path';

// --- Vercel KV (Redis) Configuration ---
let redisClient: ReturnType<typeof createClient> | null = null;
const isKvEnabled = !!process.env.KV_URL;

async function getClient() {
  if (!isKvEnabled) {
    return null; // Return null if KV is not configured
  }

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.KV_URL,
    });
    redisClient.on('error', (err) =>
      console.error('Redis Client Error', err)
    );
  }

  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (error) {
       console.error('Failed to connect to Redis:', error);
       redisClient = null;
       return null;
    }
  }
  return redisClient;
}

// --- Local File Fallback Configuration ---
const dataDir = path.join('/tmp', 'data');
const dbFilePath = path.join(dataDir, 'db.json');

async function ensureDbFileExists() {
  try {
    await fs.access(dbFilePath);
  } catch {
    console.log('Local db.json not found. Creating from template.');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dbFilePath, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

async function readFromFile(): Promise<DbData> {
    await ensureDbFileExists();
    const fileContent = await fs.readFile(dbFilePath, 'utf-8');
    return JSON.parse(fileContent) as DbData;
}

async function writeToFile(data: DbData): Promise<void> {
    await ensureDbFileExists();
    await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
}


// --- Unified DB Functions ---

export async function checkDbConnection(): Promise<{ ok: boolean; error?: string; driver: 'kv' | 'file' }> {
    if (isKvEnabled) {
        try {
            const client = await getClient();
            if (!client) throw new Error("KV client failed to initialize.");
            const response = await client.ping();
            if (response === 'PONG') {
                return { ok: true, driver: 'kv' };
            }
            return { ok: false, error: 'Ping command did not return PONG.', driver: 'kv' };
        } catch (error: any) {
            console.error('KV connection check failed:', error);
            return { ok: false, error: error.message, driver: 'kv' };
        }
    } else {
        // For file system, "connection" is just writability.
        try {
            await ensureDbFileExists();
            return { ok: true, driver: 'file' };
        } catch(error: any) {
             return { ok: false, error: error.message, driver: 'file' };
        }
    }
}


export async function readDb(): Promise<DbData> {
  const client = await getClient();

  if (client) {
    try {
      let dbData = await client.hGetAll(DB_KEY);

      if (!dbData || Object.keys(dbData).length === 0) {
        console.log('No data in Vercel KV. Initializing from template.');
        const preparedData = Object.fromEntries(
          Object.entries(initialData).map(([key, value]) => [
            key,
            JSON.stringify(value),
          ])
        );
        await client.hSet(DB_KEY, preparedData);
        dbData = preparedData;
      }
      
      // Safely parse each key
      return {
        users: dbData.users ? JSON.parse(dbData.users) : [],
        clients: dbData.clients ? JSON.parse(dbData.clients) : [],
        projects: dbData.projects ? JSON.parse(dbData.projects) : [],
        settings: dbData.settings ? JSON.parse(dbData.settings) : {},
      };

    } catch (error) {
      console.error('Error reading from Vercel KV, falling back to file system:', error);
      return readFromFile();
    }
  } else {
    // Fallback to local file if KV is not enabled
    return readFromFile();
  }
}

export async function writeDb(data: DbData): Promise<void> {
  const client = await getClient();

  if (client) {
    try {
      const dataToWrite = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          JSON.stringify(value),
        ])
      );
      await client.hSet(DB_KEY, dataToWrite);
    } catch (error) {
      console.error('Error writing to Vercel KV, falling back to file system:', error);
      await writeToFile(data);
    }
  } else {
    // Fallback to local file if KV is not enabled
    await writeToFile(data);
  }
}

export async function writeSetupCompleted(): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      await client.set('setupCompleted', 'true');
      console.log('Setup completion status saved to Vercel KV.');
    } catch (error) {
      console.error('Failed to write setup completion status to Vercel KV:', error);
      // As a fallback, we can try to handle this, but for now, we just log it.
      // In a real-world scenario, you might want to have a more robust fallback.
    }
  }
  // No file-based fallback for this as it's tied to the middleware's env var check.
}


const DB_KEY = 'db';
