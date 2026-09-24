// bookings-enquiries.service.ts
// Manages bookings/enquiries submitted to a business.
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const BUSINESS_SELECT = { id: true, name: true, slug: true } as const;

function formatWhen(date: Date, time: string) {
  return `${date.toISOString().split('T')[0]} at ${time}`;
}

@Injectable()
export class BookingsEnquiriesService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

  // The logged-in user's own bookings (what /bookings shows).
  findAllForUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { business: { select: BUSINESS_SELECT } },
    });
  }

  // Bookings made on businesses this user owns (the owner's "Booking
  // requests" page). Includes guest bookings — they carry contact details.
  findReceivedForOwner(ownerId: string) {
    return this.prisma.booking.findMany({
      where: { business: { ownerId } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { business: { select: BUSINESS_SELECT } },
    });
  }

  async create(userId: string | undefined, dto: CreateBookingDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      include: { owner: { select: { email: true, name: true } } },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (business.status !== 'approved') {
      throw new BadRequestException('This business is not accepting bookings yet.');
    }

    // A guest has no account to look them up by, so they must leave a way
    // to be reached - a logged-in user already has one on file (their account).
    if (!userId && !dto.contactPhone && !dto.contactEmail) {
      throw new BadRequestException(
        'Guests must provide a contact phone or email so the business can reach you.',
      );
    }

    const booking = await this.prisma.booking.create({
      data: {
        businessId: dto.businessId,
        userId: userId ?? null,
        date: new Date(dto.date),
        time: dto.time,
        service: dto.service,
        details: dto.details,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
      },
      include: { business: { select: BUSINESS_SELECT } },
    });

    // Best-effort heads-up to the business. MailService never throws, and we
    // don't wait on it, so a mail problem can't fail the booking itself.
    const ownerEmail = business.email || business.owner?.email;
    if (ownerEmail) {
      const when = formatWhen(booking.date, booking.time);
      const who = dto.contactName || 'A customer';
      void this.mail.send({
        to: ownerEmail,
        subject: `New booking request for ${business.name}`,
        text: `${who} requested a booking for ${when}${dto.service ? ` (${dto.service})` : ''}.\n\nPhone: ${dto.contactPhone ?? '-'}\nEmail: ${dto.contactEmail ?? '-'}\n\nLog in to your dashboard to confirm or decline it.`,
        html: `<p>${escapeHtml(who)} requested a booking for <strong>${escapeHtml(when)}</strong>${dto.service ? ` (${escapeHtml(dto.service)})` : ''}.</p><p>Phone: ${escapeHtml(dto.contactPhone ?? '-')}<br>Email: ${escapeHtml(dto.contactEmail ?? '-')}</p><p>Log in to your dashboard to confirm or decline it.</p>`,
      });
    }

    return booking;
  }

  // Owner (or an admin) confirms or declines a booking on their business.
  async updateStatus(
    id: string,
    status: 'confirmed' | 'declined',
    actor: { userId: string; role?: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { ...BUSINESS_SELECT, ownerId: true } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.business.ownerId !== actor.userId && actor.role !== 'admin') {
      throw new ForbiddenException('You do not own this business');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('The customer already cancelled this booking.');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status },
      include: { business: { select: BUSINESS_SELECT } },
    });

    // Notify whoever made the booking - the account email for a logged-in
    // user, or the contact email they left as a guest - but only when the
    // status actually changed. Never blocks the update; MailService swallows
    // its own errors.
    const recipient = booking.user?.email ?? booking.contactEmail;
    if (recipient && booking.status !== status) {
      const when = formatWhen(booking.date, booking.time);
      const greeting = booking.contactName ?? booking.user?.name ?? 'there';
      void this.mail.send({
        to: recipient,
        subject: `Your booking at ${booking.business.name} was ${status}`,
        text: `Hi ${greeting},\n\nYour booking request at ${booking.business.name} for ${when} was ${status}.`,
        html: `<p>Hi ${escapeHtml(greeting)},</p><p>Your booking request at <strong>${escapeHtml(booking.business.name)}</strong> for ${escapeHtml(when)} was <strong>${status}</strong>.</p>`,
      });
    }

    return updated;
  }

  // The customer cancels one of their own bookings. Guest bookings have no
  // account attached, so they can't be cancelled through the API.
  async cancel(id: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!booking.userId || booking.userId !== userId) {
      throw new ForbiddenException('This is not your booking');
    }
    if (['cancelled', 'declined', 'rejected'].includes(booking.status)) {
      throw new BadRequestException(`This booking is already ${booking.status}.`);
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { business: { select: BUSINESS_SELECT } },
    });
  }
}
