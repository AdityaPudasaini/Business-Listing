// contact.service.ts — stores contact-form messages and emails them to the site inbox.
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

@Injectable()
export class ContactService {
  // A public form with no login is spam bait, so keep a small per-IP limit.
  // In-memory: fine for a single instance, resets on restart.
  private readonly hits = new Map<string, number[]>();

  constructor(private prisma: PrismaService, private mail: MailService) {}

  private assertWithinLimit(ip: string) {
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);

    if (recent.length >= MAX_PER_WINDOW) {
      throw new HttpException(
        'You have sent several messages recently. Please try again in a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.hits.set(ip, recent);

    if (this.hits.size > 1000) {
      for (const [key, times] of this.hits) {
        if (times.every((time) => now - time >= WINDOW_MS)) this.hits.delete(key);
      }
    }
  }

  async create(dto: CreateContactDto, ip: string) {
    this.assertWithinLimit(ip);

    const saved = await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        message: dto.message.trim(),
      },
    });

    // Notify the site owner. Failure here must not lose or reject the message — it's already saved.
    const inbox = process.env.CONTACT_INBOX_EMAIL;
    if (inbox) {
      const name = saved.name.replace(/[\r\n]+/g, ' ');
      const sent = await this.mail.send({
        to: inbox,
        replyTo: saved.email,
        subject: `New contact message from ${name}`,
        text: `From: ${name} <${saved.email}>\n\n${saved.message}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(saved.email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(saved.message)}</p>`,
      });
      if (sent) {
        await this.prisma.contactMessage.update({
          where: { id: saved.id },
          data: { emailSent: true },
        });
      }
    }

    return { message: 'Thanks — your message has been received.' };
  }

  // Admin-only: newest first.
  findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}