"use server";

import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';

const setupSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});

export async function createFirstAdmin(data: unknown) {
  const result = setupSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "Invalid data provided." };
  }
  
  try {
    // Step 1: Run migrations to ensure tables exist. This is the most reliable place.
    console.log("Applying database schema during setup...");
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log("Schema applied successfully.");

    // Step 2: Check if an admin already exists.
    const existingAdminsResult = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (existingAdminsResult.length > 0) {
      console.warn("Setup attempt failed: An admin account already exists.");
      return { success: false, error: "An admin account already exists." };
    }
    
    // Step 3: Create the new admin user.
    const { name, email, password } = result.data;
    const hashedPassword = await hashPassword(password);
    const newAdminId = `admin-${Date.now()}`;

    const newAdmin = {
      id: newAdminId,
      name,
      email,
      phone: "", // Phone can be optional for admin
      role: "admin" as const,
      initials: name.substring(0, 2).toUpperCase(),
      password: hashedPassword,
    };

    await db.insert(users).values(newAdmin);
    console.log("First admin account created successfully.");
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create first admin:", error);
    // Provide a more specific error if available
    const errorMessage = error.message?.includes("_journal.json")
      ? "Migration files are missing. Ensure the 'drizzle' folder is correctly deployed."
      : "Could not create admin account due to a server error.";
    return { success: false, error: errorMessage };
  }
}
