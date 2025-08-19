
import 'server-only';
import { readDb } from '@/lib/db';
import type { Project } from '@/types';

const PIPRAPAY_API_URL = 'https://piprapay.com/api/v2/create-payment';
const PIPRAPAY_VERIFY_URL = 'https://piprapay.com/api/v2/verify-payment';

export async function createPipraPayPayment(project: Project, customerInfo: { name: string, email: string, phone: string }) {
    const db = readDb();
    const { piprapayApiKey, piprapayApiSecret } = db.settings;

    if (!piprapayApiKey || !piprapayApiSecret) {
        return { success: false, error: 'PipraPay credentials are not configured.' };
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/piprapay/callback?status=success&invoiceId=${project.orderId}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/piprapay/callback?status=cancel&invoiceId=${project.orderId}`;

    const body = {
        apiKey: piprapayApiKey,
        apiSecret: piprapayApiSecret,
        amount: project.amount,
        currency: 'BDT',
        invoiceId: project.orderId,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        customerInfo: customerInfo
    };

    try {
        const response = await fetch(PIPRAPAY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (data.success) {
            return { success: true, payment_url: data.payment_url };
        } else {
            return { success: false, error: data.message || 'Failed to create PipraPay payment.' };
        }

    } catch (error: any) {
        console.error('PipraPay API error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred with PipraPay.' };
    }
}

export async function verifyPipraPayPayment(invoiceId: string) {
    const db = readDb();
    const { piprapayApiKey, piprapayApiSecret } = db.settings;

    if (!piprapayApiKey || !piprapayApiSecret) {
        return { success: false, error: 'PipraPay credentials are not configured.' };
    }

    const body = {
        apiKey: piprapayApiKey,
        apiSecret: piprapayApiSecret,
        invoiceId: invoiceId
    };

    try {
        const response = await fetch(PIPRAPAY_VERIFY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (data.success) {
            return { success: true, status: data.status };
        } else {
            return { success: false, error: data.message || 'Payment verification failed.' };
        }
    } catch (error: any) {
        console.error('PipraPay verification error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during verification.' };
    }
}
