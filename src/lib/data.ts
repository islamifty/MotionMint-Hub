import type { Client, Project, User } from "@/types";
import { readDb, writeDb } from './db';

export const adminEmails = ["admin@motionflow.com"];

// Read initial data from the DB
const db = readDb();

// Use the data from db.json as the source of truth.
// The arrays below are now proxies to the data in the db object.
export const users: User[] = db.users;
export const clients: Client[] = db.clients;
export const projects: Project[] = db.projects;
