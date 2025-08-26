
import 'server-only';
import nodemailer from 'nodemailer';
import { readDb } from './db';
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

    if (testConfig) {
        settings = testConfig;
    } else {
        const db = await readDb();
        settings = db.settings;
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
