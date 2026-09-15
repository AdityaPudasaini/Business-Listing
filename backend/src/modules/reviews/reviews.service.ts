// reviews.service.ts
// Manages customer reviews on a listing.
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { CreateReviewDto } from './dto/create-review.dto';

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
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(businessId: string, userId: string, dto: CreateReviewDto) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Owners shouldn't be able to review (and inflate the rating of) their own listing.
    if (business.ownerId === userId) {
      throw new ForbiddenException('You cannot review your own business');
    }

    const existing = await this.prisma.review.findFirst({
      where: { businessId, userId },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this business');
    }

    try {
      const review = await this.prisma.review.create({
        data: { businessId, userId, rating: dto.rating, comment: dto.comment },
        include: { user: { select: { id: true, name: true } } },
      });

      await this.recalculateRating(businessId);

      return review;
    } 
    
    catch (err) {
      // Belt-and-suspenders: if two requests race past the findFirst check
      // above at the same instant, the DB's @@unique constraint catches it.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('You have already reviewed this business');
      }
      throw err;
    }
  }

  async remove(reviewId: string, userId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('You can only delete your own review');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recalculateRating(review.businessId);

    return { message: 'Review deleted' };
  }

  private async recalculateRating(businessId: string) {
    const result = await this.prisma.review.aggregate({
      where: { businessId },
      _avg: { rating: true },
    });

    await this.prisma.business.update({
      where: { id: businessId },
      data: { rating: result._avg.rating ?? 0 },
    });
  }
}