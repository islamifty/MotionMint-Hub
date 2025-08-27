
import 'server-only';
import type { AppSettings } from '@/types';

async function getBkashToken(settings: AppSettings): Promise<string> {
    const { 
        bKashAppKey, 
        bKashAppSecret, 
        bKashUsername, 
        bKashPassword, 
        bKashMode 
    } = settings;

    if (!bKashAppKey || !bKashAppSecret || !bKashUsername || !bKashPassword) {
        console.error('bKash credentials are not configured.');
        throw new Error('bKash credentials are not configured.');
    }

    const baseUrl = bKashMode === 'sandbox' 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    const response = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'username': bKashUsername,
            'password': bKashPassword,
        },
        body: JSON.stringify({
             app_key: bKashAppKey, 
             app_secret: bKashAppSecret 
        }),
        cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.id_token) {
        console.error('bKash token grant failed:', data);
        throw new Error(data.statusMessage || 'Failed to get bKash token.');
    }
    console.info('bKash token granted successfully.');
    return data.id_token;
}

export async function createPayment(paymentRequest: any, settings: AppSettings) {
    const { bKashAppKey, bKashMode } = settings;
    
    if (!bKashAppKey) {
        console.error('bKash App Key is not configured.');
        throw new Error('bKash App Key is not configured.');
    }

    const id_token = await getBkashToken(settings);
    
    const baseUrl = bKashMode === 'sandbox' 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    const response = await fetch(`${baseUrl}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': bKashAppKey,
        },
        body: JSON.stringify(paymentRequest),
        cache: 'no-store'
    });
    
    const data = await response.json();

    if (response.ok && data.statusCode === '0000') {
        console.info('bKash payment creation successful.', { paymentID: data.paymentID });
        return {
            bkashURL: data.bkashURL,
            paymentID: data.paymentID
        };
    } else {
        console.error("bKash create payment failed:", data);
        throw new Error(data.statusMessage || 'Failed to create bKash payment.');
    }
}

export async function executePayment(paymentID: string, settings: AppSettings) {
    const { bKashAppKey, bKashMode } = settings;
    
    if (!bKashAppKey) {
         console.error('bKash App Key is not configured.');
        throw new Error('bKash App Key is not configured.');
    }
    
    const id_token = await getBkashToken(settings);

    const baseUrl = bKashMode === 'sandbox' 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    const response = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': bKashAppKey,
        },
        body: JSON.stringify({ paymentID }),
        cache: 'no-store'
    });
    
    const data = await response.json();
    
    if (response.ok && data.statusCode === '0000') {
        console.info('bKash payment execution successful.', { paymentID, transactionStatus: data.transactionStatus });
        return data;
    } else {
        console.error("bKash execute payment failed:", data);
        throw new Error(data.statusMessage || 'Failed to execute bKash payment.');
    }
}
