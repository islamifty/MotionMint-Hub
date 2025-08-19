import { readDb } from './db';

// This is a simplified bKash API client. In a real-world scenario, you'd want more robust error handling.

const BKASH_API_BASE_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta'; // Use PRODUCTION URL

async function getBkashToken(): Promise<string> {
    const db = readDb();
    const { bkashAppKey, bkashAppSecret, bkashUsername, bkashPassword } = db.settings;

    if (!bkashAppKey || !bkashAppSecret || !bkashUsername || !bkashPassword) {
        throw new Error('bKash credentials are not configured in settings.');
    }

    const response = await fetch(`${BKASH_API_BASE_URL}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'username': bkashUsername,
            'password': bkashPassword,
        },
        body: JSON.stringify({
             app_key: bkashAppKey, 
             app_secret: bkashAppSecret 
        }),
    });

    const data = await response.json();
    if (!response.ok || !data.id_token) {
        throw new Error(data.statusMessage || 'Failed to get bKash token.');
    }
    return data.id_token;
}

export async function createPayment(paymentRequest: any) {
    const id_token = await getBkashToken();
    const db = readDb();
    const { bkashAppKey } = db.settings;

    const response = await fetch(`${BKASH_API_BASE_URL}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': bkashAppKey || '',
        },
        body: JSON.stringify(paymentRequest),
    });

    const data = await response.json();
    if (response.ok && data.statusCode === '0000') {
        return {
            bkashURL: data.bkashURL,
            paymentID: data.paymentID
        };
    } else {
        throw new Error(data.statusMessage || 'Failed to create bKash payment.');
    }
}

export async function executePayment(paymentID: string) {
    const id_token = await getBkashToken();
    const db = readDb();
    const { bkashAppKey } = db.settings;

    const response = await fetch(`${BKASH_API_BASE_URL}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': bkashAppKey || '',
        },
        body: JSON.stringify({ paymentID }),
    });
    
    return await response.json();
}
