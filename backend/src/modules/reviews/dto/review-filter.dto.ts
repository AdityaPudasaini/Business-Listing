// review-filter.dto.ts
// Validates the query params of GET /businesses/:id/reviews
// e.g. /businesses/abc123/reviews?page=2&limit=10&sort=newest
import { IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'highest', 'lowest'])
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest';
}