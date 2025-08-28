'use server';

import { createPayment as createBkashPayment } from '@/lib/bkash';
import { db } from '@/lib/turso';
import { projects } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getSettings } from '@/app/admin/settings/actions';
import type { Project, User } from '@/types';
import { getSession } from '@/lib/session';
import { getBaseUrl } from '@/lib/url';
import { unstable_noStore as noStore } from 'next/cache';

export async function getProjectDetails(projectId: string): Promise<{ project: Project | null, user: User | null }> {
    noStore();
    const session = await getSession();
    if (!session?.user) {
        return { project: null, user: null };
    }

    const projectResult = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.clientId, session.user.id))).limit(1);
    const project = projectResult[0];
    
    return { project: (project as Project) || null, user: session.user };
}


export async function initiateBkashPayment(projectId: string) {
    try {
        const projectResult = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        const project = projectResult[0];
        
        if (!project) {
            throw new Error('Project not found');
        }
        
        const settings = await getSettings();
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
        
        console.info('Initiating bKash payment', { projectId: project.id, orderId: project.orderId });
        const result = await createBkashPayment(paymentData, settings);

        if (result && result.bkashURL) {
            console.info('bKash payment initiated successfully', { projectId: project.id });
            return { success: true, paymentURL: result.bkashURL };
        } else {
            console.error('bKash payment initiation failed:', result);
            return { success: false, error: 'Could not initiate bKash payment.' };
        }
    } catch (error: any) {
        console.error('Error in initiateBkashPayment:', { error: error.message, projectId });
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

        console.info('Initiating PipraPay payment', chargePayload);
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
            console.info('PipraPay payment initiated successfully', { projectId: project.id, paymentUrl: data.paymentUrl });
            return { success: true, paymentURL: data.paymentUrl };
        } else {
            console.error("Failed to create PipraPay charge:", data);
            return { success: false, error: data.message || 'Could not initiate PipraPay payment.' };
        }
    } catch (error: any) {
        console.error('Error in initiatePipraPayPayment:', { error: error.message, projectId: project.id });
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
