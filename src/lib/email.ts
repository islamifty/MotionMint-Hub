
import 'server-only';
import nodemailer from 'nodemailer';
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
    // Prioritize passed config, then environment variables
    const settings = {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        ...smtpConfig,
    };

    const { smtpHost, smtpPort, smtpUser, smtpPass } = settings;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.error('SMTP settings are not fully configured in environment variables.');
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
        from: `"MotionMint Hub" <${smtpUser}>`, // Using a friendly name
        ...mailOptions,
    };
    
    await transporter.sendMail(options);
}
