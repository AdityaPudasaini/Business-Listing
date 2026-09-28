// customers.service.ts — "Customers" view for a business owner (or admin).
// Same idea as AnnouncementsService.resolveRecipients: there's no dedicated
// Customer table, so a business's customers are the Users who have a
// Booking and/or a Review against it, merged by user id. Personal messages
// (OwnerMessage) are loaded per customer; there's no ChatLog model yet, so
// chatLog always comes back empty.
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { SendCustomerMessageDto } from './dto/send-customer-message.dto';

interface Requester {
  userId: string;
  role: string;
}

const USER_SELECT = { id: true, name: true, email: true, phone: true } as const;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

  private async assertCanView(businessId: string, requester: Requester) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (requester.role !== 'admin' && business.ownerId !== requester.userId) {
      throw new ForbiddenException('You do not own this business');
    }
    return business;
  }

  private async customersForBusiness(businessId: string, businessName: string) {
    const [bookings, reviews, ownerMessages] = await Promise.all([
      this.prisma.booking.findMany({
        where: { businessId },
        orderBy: { date: 'desc' },
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.review.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: USER_SELECT } },
      }),
      this.prisma.ownerMessage.findMany({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    type MessageRow = {
      id: string;
      sender: 'owner';
      content: string;
      createdAt: string;
      read: boolean;
      emailSent: boolean;
    };

    type Row = {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      businessId: string;
      businessName: string;
      bookings: {
        id: string;
        date: string;
        time: string;
        service: string | null;
        status: string;
      }[];
      review?: {
        id: string;
        rating: number;
        title: string | null;
        message: string | null;
        createdAt: string;
      };
      chatLog: never[];
      messages: MessageRow[];
    };

    const byUserId = new Map<string, Row>();
    // The id the frontend gets back is "<businessId>:<userId>" — it already
    // splits on ":" and keeps the last part when it needs a bare user id
    // (see CustomersPage's AnnouncementModal), so keep this format stable.
    const ensure = (user: { id: string; name: string; email: string; phone: string | null }) => {
      let row = byUserId.get(user.id);
      if (!row) {
        row = {
          id: `${businessId}:${user.id}`,
          name: user.name,
          email: user.email,
          phone: user.phone,
          businessId,
          businessName,
          bookings: [],
          chatLog: [],
          messages: [],
        };
        byUserId.set(user.id, row);
      }
      return row;
    };

    for (const booking of bookings) {
      if (!booking.user) continue;
      const row = ensure(booking.user);
      row.bookings.push({
        id: booking.id,
        date: booking.date.toISOString(),
        time: booking.time,
        service: booking.service,
        status: booking.status,
      });
    }

    for (const review of reviews) {
      if (!review.user) continue;
      const row = ensure(review.user);
      if (!row.review) {
        row.review = {
          id: review.id,
          rating: review.rating,
          title: review.title,
          message: review.comment,
          createdAt: review.createdAt.toISOString(),
        };
      }
    }

    for (const message of ownerMessages) {
      const row = byUserId.get(message.recipientId);
      if (row) row.messages.push(this.toMessageRow(message));
    }

    return Array.from(byUserId.values());
  }

  private toMessageRow(message: {
    id: string;
    content: string;
    createdAt: Date;
    emailSent: boolean;
  }) {
    return {
      id: message.id,
      sender: 'owner' as const,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      read: true,
      emailSent: message.emailSent,
    };
  }

  // Personal message from the owner (or an admin) to one customer. The customer
  // id is a User id; they must have booked or reviewed this business. The
  // email's reply-to is the business, so hitting Reply reaches the owner.
  async sendMessage(
    businessId: string,
    customerUserId: string,
    dto: SendCustomerMessageDto,
    requester: Requester,
  ) {
    const business = await this.assertCanView(businessId, requester);

    const [booking, review] = await Promise.all([
      this.prisma.booking.findFirst({ where: { businessId, userId: customerUserId }, select: { id: true } }),
      this.prisma.review.findFirst({ where: { businessId, userId: customerUserId }, select: { id: true } }),
    ]);
    if (!booking && !review) {
      throw new NotFoundException('That person is not a customer of this business');
    }

    const customer = await this.prisma.user.findUnique({
      where: { id: customerUserId },
      select: { name: true, email: true },
    });
    if (!customer?.email) {
      throw new BadRequestException('This customer has no email address on file');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: business.ownerId },
      select: { email: true },
    });
    const content = dto.content.trim();

    // Awaited on purpose (unlike the fire-and-forget booking emails): the owner
    // should be told if it could not be delivered. MailService never throws.
    const emailSent = await this.mail.send({
      to: customer.email,
      replyTo: business.email || owner?.email || undefined,
      subject: `Message from ${business.name}`,
      text: `Hi ${customer.name},\n\n${content}\n\n— ${business.name}\n(Reply to this email to answer them directly.)`,
      html: `<p>Hi ${escapeHtml(customer.name)},</p><p style="white-space:pre-wrap">${escapeHtml(content)}</p><p>— ${escapeHtml(business.name)}<br><small>Reply to this email to answer them directly.</small></p>`,
    });

    const saved = await this.prisma.ownerMessage.create({
      data: {
        businessId,
        senderId: requester.userId,
        recipientId: customerUserId,
        content,
        emailSent,
      },
    });

    return this.toMessageRow(saved);
  }

  // Everyone who booked or reviewed one specific business. Owner (of that
  // business) or admin.
  async forBusiness(businessId: string, requester: Requester) {
    const business = await this.assertCanView(businessId, requester);
    return this.customersForBusiness(businessId, business.name);
  }

  // Every customer across every business the requester owns — powers the
  // owner dashboard's "All my businesses" view.
  async forOwner(ownerId: string) {
    const businesses = await this.prisma.business.findMany({
      where: { ownerId },
      select: { id: true, name: true },
    });
    const perBusiness = await Promise.all(
      businesses.map((business) => this.customersForBusiness(business.id, business.name)),
    );
    return perBusiness.flat();
  }
}