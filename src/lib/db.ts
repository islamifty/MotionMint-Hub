'use server';

// This is a simple file-based database.
// In a real-world application, you would use a proper database like PostgreSQL, MySQL, or a NoSQL database.
import fs from 'fs';
import path from 'path';
import type { DbData } from "@/types";
import { hashPassword } from './password';
import { adminEmails } from './data';

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

// This is the initial data structure that will be written to db.json if it doesn't exist.
const initialData: DbData = {
    users: [],
    clients: [],
    projects: [],
    settings: {
        nextcloudUrl: "",
        nextcloudUser: "",
        nextcloudPassword: "",
    }
};

async function createDefaultAdmin(): Promise<DbData> {
    console.log("No users found. Creating default admin account...");
    const adminEmail = adminEmails[0];
    const hashedPassword = await hashPassword('password123');
    const newAdmin = {
      id: "admin-main",
      name: "Admin",
      email: adminEmail,
      phone: "01234567890",
      role: "admin" as const,
      initials: "AD",
      password: hashedPassword,
    };

    const dataWithAdmin: DbData = {
        ...initialData,
        users: [newAdmin]
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(dataWithAdmin, null, 2), 'utf8');
    console.log("Default admin account created successfully.");
    return dataWithAdmin;
}


// Function to read the database file
export async function readDb(): Promise<DbData> {
    try {
        if (!fs.existsSync(dbPath)) {
            // If the file doesn't exist, create it with initial data and a default admin
            return await createDefaultAdmin();
        }
        const fileContents = fs.readFileSync(dbPath, 'utf8');
        // If file is empty, initialize it
        if (!fileContents) {
            return await createDefaultAdmin();
        }
        
        const jsonData: DbData = JSON.parse(fileContents);
        
        // If file exists but is empty of users, create admin
        if (!jsonData.users || jsonData.users.length === 0) {
            return await createDefaultAdmin();
        }

        // Ensure settings object exists
        if (!jsonData.settings) {
            jsonData.settings = initialData.settings;
        }
        return jsonData;
    } catch (error) {
        console.error("Critical error reading or parsing db.json:", error);
        // Fallback to creating a new DB with admin if parsing fails
        return await createDefaultAdmin();
    }
}

// Function to write to the database file
export async function writeDb(data: DbData): Promise<void> {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
}
