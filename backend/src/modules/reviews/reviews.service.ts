// reviews.service.ts
// Manages customer reviews on a listing.
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewFilterDto } from './dto/review-filter.dto';

// Maps the friendly `sort` query param to a Prisma orderBy clause
const SORT_MAP = {
  newest: { createdAt: 'desc' as const },
  oldest: { createdAt: 'asc' as const },
  highest: { rating: 'desc' as const },
  lowest: { rating: 'asc' as const },
};

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findByBusiness(businessId: string, filters: ReviewFilterDto) {
    // Fail fast with a clear 404 if the business doesn't exist,
    // instead of silently returning an empty array.
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const orderBy = SORT_MAP[filters.sort ?? 'newest'];

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { businessId },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where: { businessId } }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // create() and remove() land on Day 2 — see reviews.controller.ts TODOs.
}