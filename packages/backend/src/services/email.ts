import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
export function initEmail(config: EmailConfig): void {
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  logger.info('Email transporter initialized');
}

/**
 * Send OTP code via email
 */
export async function sendOTPEmail(email: string, code: string): Promise<void> {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'auth@onkey.dev',
    to: email,
    subject: 'Your Onkey Authentication Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Onkey Authentication Code</h2>
        <p>Use the following code to complete your login:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
    text: `Your Onkey authentication code is: ${code}\n\nThis code will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info({ email }, 'OTP email sent');
  } catch (error) {
    // Log full error details
    logger.error({ 
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      email 
    }, 'Failed to send OTP email');
    throw new Error('Failed to send email');
  }
}


