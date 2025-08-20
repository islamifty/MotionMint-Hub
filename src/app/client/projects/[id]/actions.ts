
'use server';

import { createPayment as createBkashPayment } from '@/lib/bkash';
import { readDb } from '@/lib/db';
import type { Project, User, AppSettings } from '@/types';
import { getSession } from '@/lib/session';
import { headers } from 'next/headers';

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

function getAppUrl() {
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${host}`;
}

export async function initiateBkashPayment(projectId: string) {
    try {
        const db = await readDb();
        const project = db.projects.find((p) => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }
        
        const appUrl = getAppUrl();
        const callbackUrl = `${appUrl}/api/bkash/callback`;

        const paymentData = {
            mode: '0011',
            payerReference: project.orderId,
            callbackURL: callbackUrl,
            amount: project.amount.toString(),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: project.orderId,
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

export async function initiatePipraPayPayment(project: Project, user: User) {
     try {
        const appUrl = getAppUrl();
        const res = await fetch(`${appUrl}/api/payments/piprapay/charge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: project.amount,
                customer_name: user.name,
                customer_email_mobile: user.email || user.phone,
                metadata: { 
                    orderId: project.orderId,
                    projectId: project.id,
                    userId: user.id
                },
            }),
        });
        
        const data = await res.json();

        if (res.ok && data.ok && data.paymentUrl) {
            return { success: true, paymentURL: data.paymentUrl };
        } else {
            console.error("Failed to create PipraPay charge:", data);
            return { success: false, error: data.message || 'Could not initiate PipraPay payment.' };
        }
    } catch (error: any) {
        console.error('Error in initiatePipraPayPayment:', error.message);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
