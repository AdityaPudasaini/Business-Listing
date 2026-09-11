// reviews.controller.ts
// Routes:
//   GET    /businesses/:businessId/reviews   — a listing's reviews (done Day 1)
//   POST   /businesses/:businessId/reviews   — post a new review     (Day 2)
//   DELETE /reviews/:id                      — delete a review       (Day 2)
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewFilterDto } from './dto/review-filter.dto';

@Controller('businesses/:businessId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(
    @Param('businessId') businessId: string,
    @Query() filters: ReviewFilterDto,
  ) {
    return this.reviewsService.findByBusiness(businessId, filters);
  }

  // @Post() create(...) — added Day 2
}