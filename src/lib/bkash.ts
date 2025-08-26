
import 'server-only';
import { logger } from './logger';

async function getBkashToken(): Promise<string> {
    const { 
        BKASH_APP_KEY, 
        BKASH_APP_SECRET, 
        BKASH_USERNAME, 
        BKASH_PASSWORD, 
        BKASH_MODE 
    } = process.env;

    if (!BKASH_APP_KEY || !BKASH_APP_SECRET || !BKASH_USERNAME || !BKASH_PASSWORD) {
        logger.error('bKash credentials are not configured in environment variables.');
        throw new Error('bKash credentials are not configured.');
    }

    const baseUrl = BKASH_MODE === 'sandbox' 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    const response = await fetch(`${baseUrl}/tokenized/checkout/token/grant`, {
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
        logger.error('bKash token grant failed:', data);
        throw new Error(data.statusMessage || 'Failed to get bKash token.');
    }
    logger.info('bKash token granted successfully.');
    return data.id_token;
}

export async function createPayment(paymentRequest: any) {
    const { BKASH_APP_KEY, BKASH_MODE } = process.env;
    
    if (!BKASH_APP_KEY) {
        logger.error('bKash App Key is not configured.');
        throw new Error('bKash App Key is not configured.');
    }

    const id_token = await getBkashToken();
    
    const baseUrl = BKASH_MODE === 'sandbox' 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    const response = await fetch(`${baseUrl}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify(paymentRequest),
        cache: 'no-store'
    });
    
    const data = await response.json();

    if (response.ok && data.statusCode === '0000') {
        logger.info('bKash payment creation successful.', { paymentID: data.paymentID });
        return {
            bkashURL: data.bkashURL,
            paymentID: data.paymentID
        };
    } else {
        logger.error("bKash create payment failed:", data);
        throw new Error(data.statusMessage || 'Failed to create bKash payment.');
    }
}

export async function executePayment(paymentID: string) {
    const { BKASH_APP_KEY, BKASH_MODE } = process.env;
    
    if (!BKASH_APP_KEY) {
         logger.error('bKash App Key is not configured.');
        throw new Error('bKash App Key is not configured.');
    }
    
    const id_token = await getBkashToken();

    const baseUrl = BKASH_MODE === 'sandbox' 
        ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' 
        : 'https://tokenized.pay.bka.sh/v1.2.0-beta';

    const response = await fetch(`${baseUrl}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': id_token,
            'X-App-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
        cache: 'no-store'
    });
    
    const data = await response.json();
    
    if (response.ok && data.statusCode === '0000') {
        logger.info('bKash payment execution successful.', { paymentID, transactionStatus: data.transactionStatus });
        return data;
    } else {
        logger.error("bKash execute payment failed:", data);
        throw new Error(data.statusMessage || 'Failed to execute bKash payment.');
    }
}
