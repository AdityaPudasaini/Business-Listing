// reviews.controller.ts
// TODO: implement the routes below. Full working example is in the guideline docx, Part C, "Reviews Module".
// Routes to build:
//   GET    /businesses/:id/reviews      — a listing's reviews
//   POST   /businesses/:id/reviews      — post a new review
//   DELETE /reviews/:id                 — review delete
import { Controller, Get } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('businesses')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll() {
    // TODO: replace this placeholder with a real Prisma query once your model is in schema.prisma
    return this.reviewsService.placeholder();
  }
}
