"use server";

import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import type { User } from "@/types";

const setupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

// A simple function to check if tables exist by querying the sqlite_master table
async function tablesExist() {
  try {
    const result: { name: string }[] = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users';`);
    return result.length > 0;
  } catch (error) {
    console.error("Error checking for tables:", error);
    return false;
  }
}

// Dummy migrate function since drizzle-kit migrations are for local dev
async function applySchema() {
    const tableCreationQueries = [
    sql`CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text NOT NULL,
        "role" text NOT NULL,
        "initials" text NOT NULL,
        "password" text NOT NULL,
        "new_project_notifications" integer DEFAULT true,
        "payment_success_notifications" integer DEFAULT true
    );`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");`,
    sql`CREATE TABLE IF NOT EXISTS "projects" (
        "id" text PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "client_id" text NOT NULL,
        "client_name" text NOT NULL,
        "preview_video_url" text NOT NULL,
        "final_video_url" text NOT NULL,
        "expiry_date" text NOT NULL,
        "payment_status" text NOT NULL,
        "order_id" text NOT NULL,
        "created_at" text NOT NULL,
        "amount" integer NOT NULL,
        FOREIGN KEY ("client_id") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
    );`,
    sql`CREATE TABLE IF NOT EXISTS "clients" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text NOT NULL,
        "company" text,
        "created_at" text NOT NULL
    );`,
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "clients_email_unique" ON "clients" ("email");`,
    sql`CREATE TABLE IF NOT EXISTS "settings" (
        "key" text PRIMARY KEY NOT NULL,
        "value" text
    );`
    ];
    
    // Execute all table creation queries
    for (const query of tableCreationQueries) {
        await db.run(query);
    }
}


export async function createFirstAdmin(data: unknown) {
  const result = setupSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "Invalid data provided." };
  }
  
  try {
    const exist = await tablesExist();
    if (!exist) {
        console.log("Tables not found, creating schema...");
        await applySchema();
        console.log("Schema created successfully.");
    }
    
    const existingAdmins = await db.select().from(users).where(sql`${users.role} = 'admin'`);
    if (existingAdmins.length > 0) {
      return { success: false, error: "An admin account already exists." };
    }

    const { name, email, password } = result.data;
    const hashedPassword = await hashPassword(password);
    const newAdminId = `admin-${Date.now()}`;

    const newAdmin = {
      id: newAdminId,
      name,
      email,
      phone: "",
      role: "admin",
      initials: name.substring(0, 2).toUpperCase(),
      password: hashedPassword,
    };

    await db.insert(users).values(newAdmin as any);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create first admin:", error);
    return { success: false, error: "Could not create admin account due to a server error." };
  }
}
