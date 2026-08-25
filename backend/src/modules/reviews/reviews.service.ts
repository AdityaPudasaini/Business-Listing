// reviews.service.ts
// TODO: inject PrismaService and implement real CRUD logic. Purpose: Manage customer reviews on a listing.
// See the guideline docx, Part C, for the exact Prisma model fields for "Review".
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  // constructor(private prisma: PrismaService) {}   // uncomment once your model is in schema.prisma

  placeholder() {
    return { message: 'Reviews module is not implemented yet — see the guideline docx, Part C.' };
  }
}
