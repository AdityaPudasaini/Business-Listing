// bookings-enquiries.service.ts
// Manages bookings/enquiries submitted to a business.
import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsEnquiriesService {
  constructor(private prisma: PrismaService, private mail: MailService) {}

  findAllForUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async create(userId: string | undefined, dto: CreateBookingDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // A guest has no account to look them up by, so they must leave a way
    // to be reached - a logged-in user already has one on file (their account).
    if (!userId && !dto.contactPhone && !dto.contactEmail) {
      throw new BadRequestException(
        'Guests must provide a contact phone or email so the business can reach you.',
      );
    }

    return this.prisma.booking.create({
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
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateStatus(id: string, requesterId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, ownerId: true } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.business.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this business');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: dto.status },
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });

    // Notify whoever made the booking - the account email for a logged-in
    // user, or the contact email they left as a guest. Never block the
    // status update on this; MailService already swallows its own errors.
    const recipient = booking.user?.email ?? booking.contactEmail;
    if (recipient) {
      const greeting = booking.contactName ?? booking.user?.name ?? 'there';
      await this.mail.send({
        to: recipient,
        subject: `Your booking at ${booking.business.name} was ${dto.status}`,
        text: `Hi ${greeting},\n\nYour booking at ${booking.business.name} on ${booking.date.toDateString()} at ${booking.time} has been ${dto.status}.`,
      });
    }

    return updated;
  }

  async cancel(id: string, requesterId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { business: { select: { ownerId: true } } },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.business.ownerId !== requesterId) {
      throw new ForbiddenException('You do not own this business');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}