// announcements.service.ts — bulk email from a business to its customers.
// There's no dedicated Customer table: a "customer" of a business is any
// User who has a Booking or a Review against it, so recipients are derived
// by joining those two tables and de-duping by user id.
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { SendAnnouncementDto } from './dto/send-announcement.dto';

interface Requester {
  userId: string;
  role: string;
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

  private async assertCanSend(businessId: string, requester: Requester) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (requester.role !== 'admin' && business.ownerId !== requester.userId) {
      throw new ForbiddenException('You do not own this business');
    }
    return business;
  }

  private async resolveRecipients(businessId: string, customerIds?: string[]) {
    const [bookingUsers, reviewUsers] = await Promise.all([
      this.prisma.booking.findMany({
        where: { businessId },
        select: { user: { select: { id: true, name: true, email: true } } },
        distinct: ['userId'],
      }),
      this.prisma.review.findMany({
        where: { businessId },
        select: { user: { select: { id: true, name: true, email: true } } },
        distinct: ['userId'],
      }),
    ]);

    const byId = new Map<string, { id: string; name: string; email: string }>();
    for (const { user } of [...bookingUsers, ...reviewUsers]) {
      if (user?.email) byId.set(user.id, user);
    }

    const all = Array.from(byId.values());
    if (!customerIds || customerIds.length === 0) return all;

    const wanted = new Set(customerIds);
    return all.filter((customer) => wanted.has(customer.id));
  }

  async send(businessId: string, dto: SendAnnouncementDto, requester: Requester) {
    const business = await this.assertCanSend(businessId, requester);
    const recipients = await this.resolveRecipients(businessId, dto.customerIds);

    if (recipients.length === 0) {
      return { sent: 0, failed: 0, total: 0, failedEmails: [] };
    }

    const subject = dto.subject.trim();
    const message = dto.message.trim();

    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.mail.send({
          to: recipient.email,
          subject: `${business.name}: ${subject}`,
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

    await this.prisma.announcement.create({
      data: {
        businessId,
        senderId: requester.userId,
        subject,
        message,
        recipientCount: sent,
        failedCount: failed,
      },
    });

    return { sent, failed, total: recipients.length, failedEmails };
  }

  async history(businessId: string, requester: Requester) {
    await this.assertCanSend(businessId, requester);
    return this.prisma.announcement.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}