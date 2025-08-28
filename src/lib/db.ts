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
        } catch(error: any) {
             return { ok: false, error: error.message, driver: 'file' };
        }
    }
}

export async function isSetupCompleted(): Promise<boolean> {
  const client = await getClient();
  if (client) {
    try {
      const usersJson = await client.hGet(DB_KEY, 'users');
      if (usersJson) {
        const users = JSON.parse(usersJson);
        // Check if there is at least one user with the 'admin' role.
        return Array.isArray(users) && users.some(u => u.role === 'admin');
      }
      return false; // No 'users' field in the hash.
    } catch (error) {
      console.error('Failed to check setup status from Vercel KV:', error);
      return false; // Assume not completed on error.
    }
  }
  // Fallback to file system
  const db = await readFromFile();
  return db.users.some(u => u.role === 'admin');
}


export async function readDb(): Promise<DbData> {
  const client = await getClient();

  if (client) {
    try {
      const dbExists = await client.exists(DB_KEY);

      if (!dbExists) {
        console.log('No data in Vercel KV. Initializing from template.');
        const preparedData = Object.fromEntries(
          Object.entries(initialData).map(([key, value]) => [
            key,
            JSON.stringify(value),
          ])
        );
        await client.hSet(DB_KEY, preparedData);
        return initialData as DbData;
      }
      
      const dbData = await client.hGetAll(DB_KEY);
       if (Object.keys(dbData).length === 0) {
        console.log('KV store is empty. Re-initializing from template.');
        const preparedData = Object.fromEntries(
          Object.entries(initialData).map(([key, value]) => [
            key,
            JSON.stringify(value),
          ])
        );
        await client.hSet(DB_KEY, preparedData);
        return initialData as DbData;
      }

      const parsedData: Partial<DbData> = {};
      for (const key in initialData) {
          if (Object.prototype.hasOwnProperty.call(initialData, key)) {
              const value = dbData[key];
              (parsedData as any)[key] = value ? JSON.parse(value) : (initialData as any)[key];
          }
      }
      return parsedData as DbData;

    } catch (error: any) {
      console.error('An unexpected error occurred while reading from Vercel KV, falling back to file system:', error);
      return readFromFile();
    }
  } else {
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
    } catch (error: any) {
      console.error('Error writing to Vercel KV, falling back to file system:', error);
      await writeToFile(data);
    }
  } else {
    await writeToFile(data);
  }
}

export async function writeSetupCompleted(): Promise<void> {
  const client = await getClient();
  if (client) {
    try {
      // This is a more robust way to mark setup as complete without a separate key.
      // The existence of an admin user is the source of truth.
      console.log('Setup completion is determined by the presence of an admin user.');
    } catch (error) {
      console.error('Failed to write setup completion status to Vercel KV:', error);
    }
  }
}
