
'use server';

import { createPayment as createBkashPayment } from '@/lib/bkash';
import { createPipraPayPayment } from '@/lib/piprapay';
import { readDb } from '@/lib/db';
import type { Project, User, AppSettings } from '@/types';
import { getSession } from '@/lib/session';

export async function getProjectDetails(projectId: string): Promise<{ project: Project | null, user: User | null, settings: AppSettings | null }> {
    const session = await getSession();
    if (!session?.user) {
        return { project: null, user: null, settings: null };
    }

    const db = await readDb();
    const project = db.projects.find((p) => p.id === projectId && p.clientId === session.user.id);
    const settings = db.settings;
    
    return { project: project || null, user: session.user, settings: settings || null };
}

export async function initiateBkashPayment(projectId: string) {
    try {
        const db = await readDb();
        const project = db.projects.find((p) => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }
        
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bkash/callback`;

        const paymentData = {
            mode: '0011',
            payerReference: project.orderId, // Using a unique reference like orderId
            callbackURL: callbackUrl, // Correct key is callbackURL
            amount: project.amount.toString(),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: project.orderId, // Correct key is merchantInvoiceNumber
        };

        const result = await createBkashPayment(paymentData);

        if (result && result.bkashURL) {
            return { success: true, paymentURL: result.bkashURL };
        } else {
            console.error('bKash payment initiation failed:', result);
            return { success: false, error: 'Could not initiate bKash payment.' };
        }
    } catch (error: any) {
        console.error('Error in initiateBkashPayment:', error.message);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function initiatePipraPayPayment(projectId: string, user: User) {
     try {
        const db = await readDb();
        const project = db.projects.find((p) => p.id === projectId);

        if (!project) {
            return { success: false, error: 'Project not found' };
        }
        
        const customerInfo = {
            name: user.name,
            email: user.email,
            phone: '01234567890' // Placeholder phone
        };
        
        const result = await createPipraPayPayment(project, customerInfo);

        if (result.success) {
            return { success: true, paymentURL: result.payment_url };
        } else {
            return { success: false, error: result.error || 'Could not initiate PipraPay payment.' };
        }
    } catch (error: any) {
        console.error('Error in initiatePipraPayPayment:', error.message);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
