import { Prisma } from '@prisma/client';
import { slugify } from '../../common/utils/slugify';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ListingsService {
    constructor(private prisma: PrismaService, private uploads: UploadsService) {}

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

  // Unlike findOne(), admins need to see pending/rejected listings too.
  async findOneForAdmin(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        _count: { select: { reviews: true } },
      },
    });
    if (!business) {
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
    // isPartner is an admin-only flag (set through adminUpdate). It is in
    // UpdateBusinessDto so the admin route can accept it, so it has to be
    // dropped here or an owner could mark their own listing as a Partner.
    const { isPartner: _adminOnly, ...ownerFields } = dto;
    return this.prisma.business.update({
      where: { id },
      data: { ...ownerFields, status: 'pending' },
    });
  }

  // Admin edit: no ownerId check (the admin isn't the owner), and the status
  // is left alone so correcting a field doesn't undo a review decision.
  async adminUpdate(id: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({
      where: { id },
      data: dto,
    });
  }

  // Every listing the logged-in user owns, whatever its status.
  findMine(ownerId: string) {
    return this.prisma.business.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForAdmin() {
    return this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { name: true, email: true } } },
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

  // Owner-only delete. Cleans up every image file on disk before removing
  // the row — reviews/bookings/products all cascade at the DB level
  // (onDelete: Cascade in schema.prisma), but files on disk don't, so that
  // part has to happen here explicitly.
  async remove(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    if (business.ownerId !== userId) {
      throw new ForbiddenException('You do not own this business');
    }

    await this.deleteWithFiles(id);
    return { message: 'Business deleted' };
  }

  // Admin delete of any listing (same file cleanup as the owner delete).
  async adminRemove(id: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    await this.deleteWithFiles(id);
    return { id, deleted: true };
  }

  // Removes the image files (listing + product images) from disk, then the
  // row. Reviews/bookings/products/chats cascade at the DB level; files don't.
  private async deleteWithFiles(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { products: { select: { image: true } } },
    });
    if (!business) return;

    await Promise.all([
      this.uploads.deleteFile(business.image),
      this.uploads.deleteFile(business.coverImage),
      ...business.gallery.map((url) => this.uploads.deleteFile(url)),
      ...business.products.map((product) => this.uploads.deleteFile(product.image)),
    ]);

    await this.prisma.business.delete({ where: { id } });
  }
}