
import 'server-only';

const BKASH_API_BASE_URL = process.env.BKASH_MODE === 'sandbox' 
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

async function getBkashToken(): Promise<string> {
    const { BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD } = process.env;

    if (!BKASH_APP_KEY || !BKASH_APP_SECRET || !BKASH_USERNAME || !BKASH_PASSWORD) {
        throw new Error('bKash credentials are not configured in environment variables.');
    }

    const response = await fetch(`${BKASH_API_BASE_URL}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'username': BKASH_USERNAME,
            'password': BKASH_PASSWORD,
        },
        body: JSON.stringify({
             app_key: BKASH_APP_KEY, 
             app_secret: BKASH_APP_SECRET 
        }),
        cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.id_token) {
        console.error('bKash token grant failed:', data);
        throw new Error(data.statusMessage || 'Failed to get bKash token.');
    }
    return data.id_token;
}

export async function createPayment(paymentRequest: any) {
    const id_token = await getBkashToken();
    const { BKASH_APP_KEY } = process.env;

    const response = await fetch(`${BKASH_API_BASE_URL}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': BKASH_APP_KEY || '',
        },
        body: JSON.stringify(paymentRequest),
        cache: 'no-store'
    });
    
    const data = await response.json();

    if (response.ok && data.statusCode === '0000') {
        return {
            bkashURL: data.bkashURL,
            paymentID: data.paymentID
        };
    } else {
        console.error("bKash create payment failed:", data);
        throw new Error(data.statusMessage || 'Failed to create bKash payment.');
    }
}

export async function executePayment(paymentID: string) {
    const id_token = await getBkashToken();
    const { BKASH_APP_KEY } = process.env;

    const response = await fetch(`${BKASH_API_BASE_URL}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': BKASH_APP_KEY || '',
        },
        body: JSON.stringify({ paymentID }),
        cache: 'no-store'
    });
    
    const data = await response.json();
    
    if (response.ok && data.statusCode === '0000') {
        return data;
    } else {
        console.error("bKash execute payment failed:", data);
        throw new Error(data.statusMessage || 'Failed to execute bKash payment.');
    }
}
