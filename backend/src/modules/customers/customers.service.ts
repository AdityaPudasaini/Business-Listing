// customers.service.ts — "Customers" view for a business owner (or admin).
// Same idea as AnnouncementsService.resolveRecipients: there's no dedicated
// Customer table, so a business's customers are the Users who have a
// Booking and/or a Review against it, merged by user id. There's no
// ChatLog or OwnerMessage model yet either, so those two arrays always come
// back empty — the frontend renders "no chat/messages yet" for them until
// those tables exist.
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface Requester {
  userId: string;
  role: string;
}

const USER_SELECT = { id: true, name: true, email: true, phone: true } as const;

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

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
    const [bookings, reviews] = await Promise.all([
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
    ]);

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
      messages: never[];
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

    return Array.from(byUserId.values());
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