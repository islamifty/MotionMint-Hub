'use server';
import 'server-only';
import nodemailer from 'nodemailer';
import { getSettings } from '@/app/admin/settings/actions';
import type { AppSettings } from '@/types';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

type SmtpConfig = Pick<AppSettings, 'smtpHost' | 'smtpPort' | 'smtpUser' | 'smtpPass'>;

export async function sendEmail(mailOptions: MailOptions, testConfig?: SmtpConfig): Promise<void> {
    let settings: SmtpConfig;

    if (testConfig && testConfig.smtpHost) {
        settings = testConfig;
    } else {
        const dbSettings = await getSettings();
        settings = {
            smtpHost: dbSettings.smtpHost,
            smtpPort: Number(dbSettings.smtpPort),
            smtpUser: dbSettings.smtpUser,
            smtpPass: dbSettings.smtpPass
        };
    }
    
    const { smtpHost, smtpPort, smtpUser, smtpPass } = settings;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.error('SMTP settings are not fully configured in the database.');
        throw new Error('SMTP settings are not configured.');
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
    
    const options = {
        from: `"MotionMint Hub" <${smtpUser}>`,
        ...mailOptions,
    };
    
    await transporter.sendMail(options);
}
