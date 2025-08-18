
import { users, clients } from './data';
import type { User, Client } from '@/types';

// This file will serve as a simple API for our in-memory data.
// In a real application, these functions would interact with a database.

export function getAllUsers(): User[] {
    return users;
}

export function getAllClients(): Client[] {
    return clients;
}

export function promoteUserToClient(userId: string): void {
    const user = users.find(u => u.id === userId);
    if (user && user.role === 'user') {
        // 1. Update the user's role
        user.role = 'client';

        // 2. Check if they already exist in the clients list
        const clientExists = clients.some(c => c.id === userId);
        
        // 3. If not, add them to the clients list
        if (!clientExists) {
            const newClient: Client = {
                id: user.id,
                name: user.name,
                email: user.email,
                projectIds: [],
                createdAt: new Date().toISOString(),
                company: '', // Add a default company if needed
            };
            clients.unshift(newClient);
        }
    } else {
        // Optional: throw an error if the user is not found or cannot be promoted
        console.warn(`User with id ${userId} could not be promoted.`);
    }
}
