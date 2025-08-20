
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

// Overload for testing connection with specific credentials
export async function sendEmail(mailOptions: MailOptions, smtpConfig?: Partial<AppSettings>): Promise<void>;

// Main implementation
export async function sendEmail(mailOptions: MailOptions, smtpConfig?: Partial<AppSettings>): Promise<void> {
    const db = await readDb();
    const settings = smtpConfig || db.settings;

    const { smtpHost, smtpPort, smtpUser, smtpPass } = settings;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.error('SMTP settings are not configured.');
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
        from: `"${smtpUser}" <${smtpUser}>`,
        ...mailOptions,
    };
    
    await transporter.sendMail(options);
}
