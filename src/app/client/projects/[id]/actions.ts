'use server';

import { redirect } from 'next/navigation';
import { createPayment } from '@/lib/bkash';
import { readDb } from '@/lib/db';
import type { Project } from '@/types';
import { getSession } from '@/lib/session';

export async function getProjectDetails(projectId: string): Promise<Project | null> {
    const session = await getSession();
    if (!session?.user) {
        return null;
    }

    const db = readDb();
    const project = db.projects.find((p) => p.id === projectId && p.clientId === session.user.id);
    
    return project || null;
}

export async function initiateBkashPayment(projectId: string) {
    try {
        const db = readDb();
        const project = db.projects.find((p) => p.id === projectId);

        if (!project) {
            throw new Error('Project not found');
        }

        const paymentData = {
            mode: '0011',
            payerReference: 'payment_for_project', // Fix: Use a valid non-empty string
            callbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/bkash/callback`,
            amount: project.amount.toString(),
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: project.orderId,
        };

        const result = await createPayment(paymentData);

        if (result && result.bkashURL) {
            return { success: true, bkashURL: result.bkashURL };
        } else {
            console.error('bKash payment initiation failed:', result);
            return { success: false, error: 'Could not initiate bKash payment.' };
        }
    } catch (error) {
        console.error('Error in initiateBkashPayment:', error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
