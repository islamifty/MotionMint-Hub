import { readDb, writeDb } from './db';
import type { User, Client, DbData } from '@/types';

// This file will serve as a simple API for our file-based database.

export async function promoteUserToClient(userId: string, db?: DbData): Promise<boolean> {
    const database = db || await readDb();
    const user = database.users.find(u => u.id === userId);

    if (user && user.role !== 'client') {
        // 1. Update the user's role
        user.role = 'client';

        // 2. Check if they already exist in the clients list
        const clientExists = database.clients.some(c => c.id === userId);
        
        // 3. If not, add them to the clients list
        if (!clientExists) {
            const newClient: Client = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                projectIds: [],
                createdAt: new Date().toISOString(),
                company: '', 
            };
            database.clients.unshift(newClient);
        }
        
        if (!db) { // Only write if we're not being called from another function that will write
             await writeDb(database);
        }
       
        return true;
    } 
    
    // User not found or already a client
    return false;
}
