import { Prisma } from '@prisma/client';
import { slugify } from '../../common/utils/slugify';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: BusinessFilterDto) {
    if (filters.lat && filters.lng && filters.radiusKm) {
      return this.findNearby(
        parseFloat(filters.lat),
        parseFloat(filters.lng),
        parseFloat(filters.radiusKm),
        filters.category,
      );
    }
    return this.prisma.business.findMany({
      where: {
        status: 'approved',
        category: filters.category ?? undefined,
        location: filters.location ?? undefined,
      },
      include: {
        _count: { select: { reviews: true } },
      },
    });
  }

  private findNearby(lat: number, lng: number, radiusKm: number, category?: string) {
    const categoryFilter = category
      ? Prisma.sql`AND category = ${category}`
      : Prisma.sql``;

    return this.prisma.$queryRaw`
      SELECT * FROM (
        SELECT *,
          (SELECT COUNT(*)::int FROM "Review" WHERE "Review"."businessId" = "Business"."id") AS "reviewCount",
          (6371 * acos(
            cos(radians(${lat})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(latitude))
          )) AS "distanceKm"
        FROM "Business"
        WHERE status = 'approved'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          ${categoryFilter}
      ) AS "businessWithDistance"
      WHERE "distanceKm" <= ${radiusKm}
      ORDER BY "distanceKm" ASC
    `;
  }

  async findOne(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        _count: { select: { reviews: true } },
      },
    });
    if (!business || business.status !== 'approved') {
      throw new NotFoundException('Business not found');
    }
    return business;
  }


  async findBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        _count: { select: { reviews: true } },
      },
    });
    if (!business || business.status !== 'approved') {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async create(dto: CreateBusinessDto, ownerId: string) {
    const slug = await this.generateUniqueSlug(dto.name);
    return this.prisma.business.create({
      data: { ...dto, ownerId, slug, status: 'pending' },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;

    while (await this.prisma.business.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix++;
    }

    return candidate;
  }

  async update(id: string, dto: UpdateBusinessDto, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }
    return this.prisma.business.update({
      where: { id },
      data: { ...dto, status: 'pending' },
    });
  }

  findPending() {
    return this.prisma.business.findMany({ where: { status: 'pending' } });
  }

  async approve(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({ where: { id }, data: { status: 'approved' } });
  }

  async reject(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({ where: { id }, data: { status: 'rejected' } });
  }
}