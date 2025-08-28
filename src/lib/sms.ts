'use server';

import 'server-only';
import { getSettings } from '@/app/admin/settings/actions';
import type { AppSettings } from '@/types';

interface SmsOptions {
  to: string;
  message: string;
}

type SmsConfig = Pick<AppSettings, 'greenwebSmsToken'>;

export async function sendSms(options: SmsOptions, testConfig?: SmsConfig): Promise<void> {
    let settings: SmsConfig;
    if (testConfig && testConfig.greenwebSmsToken) {
        settings = testConfig;
    } else {
        const dbSettings = await getSettings();
        settings = { greenwebSmsToken: dbSettings.greenwebSmsToken };
    }

    const { greenwebSmsToken } = settings;

    if (!greenwebSmsToken) {
        console.error('SMS settings (Token) are not configured in the database.');
        throw new Error('SMS settings are not configured.');
    }

    const url = 'http://api.greenweb.com.bd/api.php';
    
    const params = new URLSearchParams();
    params.append('token', greenwebSmsToken);
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
        
        const responseText = await response.text();
        
        if (!response.ok) {
            console.error(`Failed to send SMS to ${options.to}`, { response: responseText, status: response.status });
            throw new Error(`Unknown error from SMS gateway. Status: ${response.status}. Response: ${responseText}`);
        }

        console.info(`SMS sent successfully to ${options.to}`, { response: responseText });

    } catch (error: any) {
        console.error('Error sending SMS via greenweb.com.bd', { 
            errorMessage: error.message,
        });
        throw new Error('Could not send SMS.');
    }
}
