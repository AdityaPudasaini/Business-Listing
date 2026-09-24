// broadcasts.service.ts — site-wide email from an admin to every user.
// Unlike AnnouncementsService (one business -> its customers), this is not
// scoped to a business: recipients are every row in the User table.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { SendBroadcastDto } from './dto/send-broadcast.dto';

@Injectable()
export class BroadcastsService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

  async send(dto: SendBroadcastDto, senderId: string) {
    // Banned accounts are skipped: they can't log in, so there is nothing for
    // them to act on in a site-wide notice.
    const recipients = await this.prisma.user.findMany({
      where: { isBanned: false },
      select: { email: true },
    });

    const subject = dto.subject.trim();
    const message = dto.message.trim();

    if (recipients.length === 0) {
      await this.prisma.broadcast.create({
        data: { senderId, subject, message, recipientCount: 0, failedCount: 0 },
      });
      return { sent: 0, failed: 0, total: 0, failedEmails: [] };
    }

    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.mail.send({
          to: recipient.email,
          subject,
          text: message,
          html: `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        }),
      ),
    );

    const failedEmails: string[] = [];
    let sent = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        sent += 1;
      } else {
        failedEmails.push(recipients[index].email);
      }
    });
    const failed = recipients.length - sent;

    await this.prisma.broadcast.create({
      data: {
        senderId,
        subject,
        message,
        recipientCount: sent,
        failedCount: failed,
      },
    });

    return { sent, failed, total: recipients.length, failedEmails };
  }

  async history() {
    return this.prisma.broadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}