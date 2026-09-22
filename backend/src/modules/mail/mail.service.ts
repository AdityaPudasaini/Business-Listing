// mail.service.ts — the one place that sends email (password reset, contact form).
// If SMTP_HOST isn't set, nothing is sent: the message is logged to the console
// instead so the flows can still be tested locally without a mail account.
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    if (!host) return;

    const user = process.env.SMTP_USER;
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      // true for port 465, false for 587/25 (STARTTLS is negotiated automatically).
      secure: process.env.SMTP_SECURE === 'true',
      auth: user ? { user, pass: process.env.SMTP_PASS } : undefined,
    });
  }

  private get from() {
    return process.env.MAIL_FROM || '"Business Listing" <no-reply@businesslisting.test>';
  }

  /** Returns true if the message was handed to the SMTP server. Never throws. */
  async send(input: MailInput): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `SMTP_HOST is not set, so this email was NOT sent.\nTo: ${input.to}\nSubject: ${input.subject}\n\n${input.text}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({ from: this.from, ...input });
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send "${input.subject}" to ${input.to}: ${(error as Error).message}`,
      );
      return false;
    }
  }
}