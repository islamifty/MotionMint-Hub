
// This file is now primarily for providing initial data if db.json doesn't exist.
// All dynamic data operations should go through lib/db.ts functions.

import type { Client, Project, User } from "@/types";
import { readDb } from './db';

export const adminEmails = ["admin@motionflow.com"];

// The readDb function will either read from db.json or create it with initial data.
const db = readDb();

// We export these so that other server components can still import them,
// but client components should fetch data via server actions.
export const users: User[] = db.users;
export const clients: Client[] = db.clients;
export const projects: Project[] = db.projects;
