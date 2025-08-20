
import 'server-only';
import { readDb } from '@/lib/db';
import type { Project } from '@/types';

export async function createPipraPayPayment(project: Project, customerInfo: { name: string, email: string, phone: string }) {
    const db = await readDb();
    const { piprapayApiKey, piprapayBaseUrl } = db.settings;

    if (!piprapayApiKey || !piprapayBaseUrl) {
        return { success: false, error: 'PipraPay API Key or Base URL is not configured.' };
    }

    const createPaymentUrl = `${piprapayBaseUrl}/create-payment`;
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/piprapay/callback?status=success&invoiceId=${project.orderId}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/piprapay/callback?status=cancel&invoiceId=${project.orderId}`;

    const body = {
        apiKey: piprapayApiKey,
        amount: project.amount,
        currency: 'BDT',
        invoiceId: project.orderId,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
        customerInfo: customerInfo
    };

    try {
        const response = await fetch(createPaymentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });
        
        if (!response.ok) {
            // If the response is not OK, read it as text to see the raw error message
            const errorText = await response.text();
            console.error(`PipraPay API Error (Status: ${response.status}):`, errorText);
            return { success: false, error: `PipraPay API returned an error: ${errorText}` };
        }
        
        try {
            const data = await response.json();
            if (data.success) {
                return { success: true, payment_url: data.payment_url };
            } else {
                return { success: false, error: data.message || 'Failed to create PipraPay payment.' };
            }
        } catch (jsonError) {
            console.error('PipraPay JSON parse error:', jsonError);
            return { success: false, error: 'Failed to parse response from PipraPay API. It might be down or returning an invalid format.' };
        }

    } catch (error: any) {
        console.error('PipraPay API error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred with PipraPay.' };
    }
}

export async function verifyPipraPayPayment(invoiceId: string) {
    const db = await readDb();
    const { piprapayApiKey, piprapayBaseUrl } = db.settings;

    if (!piprapayApiKey || !piprapayBaseUrl) {
        return { success: false, error: 'PipraPay API Key or Base URL is not configured.' };
    }

    const verifyPaymentUrl = `${piprapayBaseUrl}/verify-payment`;

    const body = {
        apiKey: piprapayApiKey,
        invoiceId: invoiceId
    };

    try {
        const response = await fetch(verifyPaymentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        });

        try {
            const data = await response.json();
            if (data.success) {
                return { success: true, status: data.status };
            } else {
                return { success: false, error: data.message || 'Payment verification failed.' };
            }
        } catch (jsonError) {
             console.error('PipraPay verification JSON parse error:', jsonError);
            return { success: false, error: 'Failed to parse verification response from PipraPay API.' };
        }
    } catch (error: any) {
        console.error('PipraPay verification error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred during verification.' };
    }
}

export async function verifyPipraPayCredentials(apiKey: string, baseUrl: string) {
    const testUrl = `${baseUrl}/verify-payment`;
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, invoiceId: 'test-connection' }),
            cache: 'no-store'
        });
        const data = await response.json();
        if (data.message === "Invalid API key") {
            return { success: false, message: 'Connection failed: Invalid API Key.' };
        }
        // A validation error for invoiceId means the API key was accepted.
        if (data.message === "Invalid invoice id") {
            return { success: true, message: 'Connection successful!' };
        }
        return { success: false, message: data.message || 'An unknown error occurred.' };
    } catch (error: any) {
        console.error('PipraPay connection test error:', error);
        if (error.cause?.code === 'ENOTFOUND') {
            return { success: false, message: 'Connection failed: Could not resolve the Base URL. Please check the URL and your network connection.' };
        }
        return { success: false, message: 'Connection failed. Please check the Base URL and your network.' };
    }
}
