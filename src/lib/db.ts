
'use server';

import { createClient } from 'redis';
import type { DbData } from '@/types';
import initialData from './db.json';
import fs from 'fs/promises';
import path from 'path';

let redisClient: ReturnType<typeof createClient> | null = null;
const isKvEnabled = !!process.env.KV_URL;
const DB_KEY = 'db';

async function getClient() {
  if (!isKvEnabled) {
    return null;
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
    try {
      await ensureDbFileExists();
      return { ok: true, driver: 'file' };
    } catch (error: any) {
      return { ok: false, error: error.message, driver: 'file' };
    }
  }
}

export async function readDb(): Promise<DbData> {
  const client = await getClient();

  if (client) {
    try {
      const dbData = await client.hGetAll(DB_KEY);
      
      // If the hash is empty, it means it's a fresh setup. Return the initial template.
      if (Object.keys(dbData).length === 0) {
        console.log('No data in Vercel KV. Initializing from template.');
        // We do NOT write here, just return the template for the current operation.
        // The first write operation (e.g., creating an admin) will populate it.
        return initialData as DbData;
      }

      // If data exists, parse it.
      const parsedData: Partial<DbData> = {};
      for (const key in initialData) {
        if (Object.prototype.hasOwnProperty.call(initialData, key)) {
          const value = dbData[key];
          // Use stored value if it exists, otherwise fallback to the template's structure (e.g., for new fields)
          (parsedData as any)[key] = value ? JSON.parse(value) : (initialData as any)[key];
        }
      }
      return parsedData as DbData;

    } catch (error: any) {
      console.error('An unexpected error occurred while reading from Vercel KV, falling back to file system:', error);
      return readFromFile();
    }
  } else {
    // Fallback to file system if KV is not enabled
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
      // Using hSet to write all fields of the hash at once
      await client.hSet(DB_KEY, dataToWrite);
    } catch (error: any) {
      console.error('Error writing to Vercel KV, falling back to file system:', error);
      await writeToFile(data);
    }
  } else {
    // Fallback to file system if KV is not enabled
    await writeToFile(data);
  }
}
