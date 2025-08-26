
'use server';

import 'server-only';
import { logger } from './logger';

interface SmsOptions {
  to: string;
  message: string;
}

interface SmsConfig {
    greenwebSmsToken?: string;
}

export async function sendSms(options: SmsOptions, smsConfig?: SmsConfig): Promise<void> {
    const settings: SmsConfig = {
        greenwebSmsToken: process.env.GREENWEB_SMS_TOKEN,
        ...smsConfig,
    };

    const { greenwebSmsToken } = settings;

    if (!greenwebSmsToken) {
        logger.error('SMS settings (Token) are not configured in environment variables.');
        throw new Error('SMS settings are not configured.');
    }

    const url = 'http://api.greenweb.com.bd/api.php';
    
    const params = new URLSearchParams();
    params.append('token', greenwebSmsToken);
    // Ensure the 'to' number is in the correct format if it includes '+'
    const toNumber = options.to.startsWith('+') ? options.to.substring(1) : options.to;
    params.append('to', toNumber);
    params.append('message', options.message);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
            cache: 'no-store',
        });
        
        // Greenweb API returns plain text, so we read it as text
        const responseText = await response.text();
        
        if (!response.ok) {
            logger.error(`Failed to send SMS to ${options.to}`, { response: responseText, status: response.status });
            throw new Error(`Unknown error from SMS gateway. Status: ${response.status}. Response: ${responseText}`);
        }

        logger.info(`SMS sent successfully to ${options.to}`, { response: responseText });

    } catch (error: any) {
        logger.error('Error sending SMS via greenweb.com.bd', { 
            errorMessage: error.message,
        });
        throw new Error('Could not send SMS.');
    }
}
