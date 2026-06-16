import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from './config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  async sendVerificationEmail(to: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/verify-email?token=${token}`;
    await this.send(to, 'Verify your Nexus AI account', `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#4f46e5">Welcome to Nexus AI!</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${link}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Verify Email
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:24px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `);
  }

  async sendPasswordResetEmail(to: string, token: string, frontendUrl: string) {
    const link = `${frontendUrl}/reset-password?token=${token}`;
    await this.send(to, 'Reset your Nexus AI password', `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#4f46e5">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${link}" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:24px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `);
  }

  async sendCreditLowAlert(to: string, credits: number) {
    await this.send(to, 'Your Nexus AI credits are running low', `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
        <h2 style="color:#f59e0b">⚠️ Low Credits Alert</h2>
        <p>You only have <strong>${credits} credits</strong> remaining.</p>
        <p>Top up your credits to continue generating AI content without interruption.</p>
        <a href="https://nexus.bachdev.xyz/dashboard#billing" style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Top Up Credits
        </a>
      </div>
    `);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: SMTP_FROM, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (e) {
      this.logger.error(`Failed to send email to ${to}: ${e.message}`);
    }
  }
}
