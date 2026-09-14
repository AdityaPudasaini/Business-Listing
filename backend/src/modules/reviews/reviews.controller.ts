import { Controller, Get, Post, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewFilterDto } from './dto/review-filter.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('businesses/:businessId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  findAll(@Param('businessId') businessId: string, @Query() filters: ReviewFilterDto) {
    return this.reviewsService.findByBusiness(businessId, filters);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('businessId') businessId: string, @Body() dto: CreateReviewDto, @Req() req) {
    return this.reviewsService.create(businessId, req.user.userId, dto);
  }
}

// Separate top-level controller: DELETE /reviews/:id doesn't nest under a businessId
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    return this.reviewsService.remove(id, req.user.userId, req.user.role);
  }
}