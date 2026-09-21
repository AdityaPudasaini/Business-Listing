// bookings-enquiries.service.ts
// Manages bookings/enquiries submitted to a business.
import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsEnquiriesService {
  constructor(private prisma: PrismaService) {}

  findAllForUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        business: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async create(userId: string, dto: CreateBookingDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.prisma.booking.create({
      data: {
        businessId: dto.businessId,
        userId,
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
}