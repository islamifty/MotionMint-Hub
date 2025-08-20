
'use server';

import 'server-only';
import { readDb } from '@/lib/db';
import { logger } from './logger';

interface SmsOptions {
  to: string;
  message: string;
}

interface SmsConfig {
    smsApiKey?: string;
    smsSenderId?: string;
}

export async function sendSms(options: SmsOptions, smsConfig?: SmsConfig): Promise<void> {
    const db = await readDb();
    
    const settings: SmsConfig = {
        smsApiKey: db.settings.smsApiKey,
        smsSenderId: db.settings.smsSenderId,
        ...smsConfig,
    };

    const { smsApiKey, smsSenderId } = settings;

    if (!smsApiKey || !smsSenderId) {
        logger.error('SMS settings (API Key or Sender ID) are not configured.');
        throw new Error('SMS settings are not configured.');
    }

    const url = 'http://sms.bdbulksms.net/api/v2/send';
    
    const params = new URLSearchParams();
    params.append('api_key', smsApiKey);
    params.append('senderid', smsSenderId);
    params.append('number', options.to);
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

        const responseData = await response.json();
        
        if (!response.ok || responseData.status !== 'SUCCESS') {
            logger.error(`Failed to send SMS to ${options.to}`, { response: responseData });
            throw new Error(responseData.message || 'Unknown error from SMS gateway.');
        }

        logger.info(`SMS sent successfully to ${options.to}`, { response: responseData });

    } catch (error: any) {
        logger.error('Error sending SMS via bdbulksms.net', { 
            errorMessage: error.message,
        });
        throw new Error('Could not send SMS.');
    }
}
