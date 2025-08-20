
import 'server-only';
import axios from 'axios';
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

    const url = 'https://bulksms.bdbulksms.net/api/v2/send';
    
    // Per official documentation, data should be form-urlencoded in the body of a POST request.
    const data = new URLSearchParams();
    data.append('api_key', smsApiKey);
    data.append('senderid', smsSenderId);
    data.append('number', options.to);
    data.append('message', options.message);
    
    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        
        if (response.data.status === 'SUCCESS') {
            logger.info(`SMS sent successfully to ${options.to}`, { response: response.data });
        } else {
            logger.error(`Failed to send SMS to ${options.to}`, { response: response.data });
            throw new Error(response.data.message || 'Unknown error from SMS gateway.');
        }
    } catch (error: any) {
        logger.error('Error sending SMS via bdbulksms.net', { 
            errorMessage: error.message,
            response: error.response?.data 
        });
        throw new Error('Could not send SMS.');
    }
}
