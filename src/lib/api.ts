import { readDb, writeDb } from './db';
import type { User, Client } from '@/types';

// This file will serve as a simple API for our file-based database.

export function promoteUserToClient(userId: string): boolean {
    const db = readDb();
    const user = db.users.find(u => u.id === userId);

    if (user && user.role === 'user') {
        // 1. Update the user's role
        user.role = 'client';

        // 2. Check if they already exist in the clients list
        const clientExists = db.clients.some(c => c.id === userId);
        
        // 3. If not, add them to the clients list
        if (!clientExists) {
            const newClient: Client = {
                id: user.id,
                name: user.name,
                email: user.email,
                projectIds: [],
                createdAt: new Date().toISOString(),
                company: '', 
            };
            db.clients.unshift(newClient);
        }

        writeDb(db);
        return true;
    } 
    
    // User not found or cannot be promoted
    return false;
}
