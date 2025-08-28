"use server";

import { z } from "zod";
import { hashPassword } from "@/lib/password";
import { db } from '@/lib/turso';
import { users } from '@/lib/schema';
import { sql, eq } from 'drizzle-orm';

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
    // The migration is now handled automatically in turso.ts
    // We just need to check if an admin already exists.
    const existingAdminsResult = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
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
      role: "admin" as const,
      initials: name.substring(0, 2).toUpperCase(),
      password: hashedPassword,
    };

    await db.insert(users).values(newAdmin);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create first admin:", error);
    return { success: false, error: "Could not create admin account due to a server error." };
  }
}
