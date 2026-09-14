import { Module } from '@nestjs/common';
import { ReviewsController, ReviewController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController, ReviewController],
  providers: [ReviewsService],
})
export class ReviewsModule {}