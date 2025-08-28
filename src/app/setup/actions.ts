"use server";

import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';

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

// Use Drizzle's official migrate function to apply schema
async function applySchema() {
    console.log("Applying schema using Drizzle migrator...");
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log("Schema migration completed.");
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
    }
    
    const existingAdminsResult = await db.select().from(users).where(sql`${users.role} = 'admin'`);
    if (existingAdminsResult.length > 0) {
      return { success: false, error: "An admin account already exists." };
    }

    const { name, email, password } = result.data;
    const hashedPassword = await hashPassword(password);
    const newAdminId = `admin-${Date.now()}`;

    const newAdmin = {
      id: newAdminId,
      name,
      email,
      phone: "", // Phone can be optional for admin
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
