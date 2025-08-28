import { db } from './turso';
import { users, clients } from './schema';
import { eq } from 'drizzle-orm';
import type { User, Client, DbData } from '@/types';

export async function promoteUserToClient(userId: string): Promise<boolean> {
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];

    if (user && user.role !== 'client') {
        
        const clientResult = await db.select().from(clients).where(eq(clients.id, userId)).limit(1);
        const clientExists = clientResult.length > 0;
        
        await db.transaction(async (tx) => {
            // 1. Update the user's role
            await tx.update(users).set({ role: 'client' }).where(eq(users.id, userId));

            // 2. If not, add them to the clients list
            if (!clientExists) {
                const newClient: Omit<Client, 'projectIds'> = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    createdAt: new Date().toISOString(),
                    company: '', 
                };
                await tx.insert(clients).values(newClient as any);
            }
        });
       
        return true;
    } 
    
    // User not found or already a client
    return false;
}
