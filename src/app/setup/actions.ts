"use server";

import { z } from "zod";
import { readDb, writeDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { User } from "@/types";

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
    const db = await readDb();

    // Double-check if an admin already exists to prevent race conditions
    const adminExists = db.users.some((user) => user.role === "admin");
    if (adminExists) {
      return { success: false, error: "An admin account already exists." };
    }

    const { name, email, password } = result.data;
    const hashedPassword = await hashPassword(password);
    const newAdminId = `admin-${Date.now()}`;

    const newAdmin: User = {
      id: newAdminId,
      name,
      email,
      phone: "", // Phone can be added later
      role: "admin",
      initials: name.substring(0, 2).toUpperCase(),
      password: hashedPassword,
    };

    db.users.unshift(newAdmin);
    await writeDb(db);
    
    // After creating the admin, the user must manually update the
    // SETUP_COMPLETED environment variable in Vercel to "true".
    console.log("Admin account created. Please update the SETUP_COMPLETED env var to 'true'.");

    return { success: true };
  } catch (error) {
    console.error("Failed to create first admin:", error);
    return { success: false, error: "Could not create admin account due to a server error." };
  }
}
