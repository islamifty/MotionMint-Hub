
'use server';

import { createPayment as createBkashPayment } from '@/lib/bkash';
import { readDb } from '@/lib/db';
import type { Project, User } from '@/types';
import { getSession } from '@/lib/session';
import { logger } from '@/lib/logger';
import { getBaseUrl } from '@/lib/url';

export async function getProjectDetails(projectId: string): Promise<{ project: Project | null, user: User | null }> {
    const session = await getSession();
    if (!session?.user) {
        return { project: null, user: null };
    }

    const db = await readDb();
    const project = db.projects.find((p) => p.id === projectId && p.clientId === session.user.id);
    
    return { project: project || null, user: session.user };
}


export async function initiateBkashPayment(projectId: string) {
    try {
        const db = await readDb();
        const project = db.projects.find((p) => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }
        
        const appUrl = getBaseUrl();
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
        
        logger.info('Initiating bKash payment', { projectId: project.id, orderId: project.orderId });
        const result = await createBkashPayment(paymentData);

        if (result && result.bkashURL) {
            logger.info('bKash payment initiated successfully', { projectId: project.id });
            return { success: true, paymentURL: result.bkashURL };
        } else {
            logger.error('bKash payment initiation failed:', result);
            return { success: false, error: 'Could not initiate bKash payment.' };
        }
    } catch (error: any) {
        logger.error('Error in initiateBkashPayment:', { error: error.message, projectId });
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

export async function initiatePipraPayPayment(project: Project, user: User) {
     try {
        const appUrl = getBaseUrl();
        
        const chargePayload = {
            amount: project.amount,
            customer_name: user.name || 'Customer',
            customer_email_mobile: user.email || user.phone || 'N/A',
            metadata: { 
                orderId: project.orderId,
                projectId: project.id,
                userId: user.id
            },
        };

        logger.info('Initiating PipraPay payment', chargePayload);
        const res = await fetch(`${appUrl}/api/payments/piprapay/charge`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(chargePayload),
            cache: 'no-store'
        });
        
        const data = await res.json();

        if (res.ok && data.ok && data.paymentUrl) {
            logger.info('PipraPay payment initiated successfully', { projectId: project.id, paymentUrl: data.paymentUrl });
            return { success: true, paymentURL: data.paymentUrl };
        } else {
            logger.error("Failed to create PipraPay charge:", data);
            return { success: false, error: data.message || 'Could not initiate PipraPay payment.' };
        }
    } catch (error: any) {
        logger.error('Error in initiatePipraPayPayment:', { error: error.message, projectId: project.id });
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
