
import 'server-only';
import axios from 'axios';
import { readDb } from '@/lib/db';
import { logger } from './logger';

interface SmsOptions {
  to: string;
  message: string;
}

export async function sendSms(options: SmsOptions): Promise<void> {
    const db = await readDb();
    const { smsApiKey, smsSenderId } = db.settings;

    if (!smsApiKey || !smsSenderId) {
        logger.error('SMS settings (API Key or Sender ID) are not configured.');
        throw new Error('SMS settings are not configured.');
    }

    const params = new URLSearchParams();
    params.append('api_key', smsApiKey);
    params.append('senderid', smsSenderId);
    params.append('number', options.to);
    params.append('message', options.message);
    
    try {
        const response = await axios.get('https://bdbulksms.net/api/v2/send', { params });
        
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
