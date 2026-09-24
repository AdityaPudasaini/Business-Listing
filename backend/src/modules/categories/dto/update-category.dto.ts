import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

// Deliberately no `id` and no `parentId` here. The id is the string every
// existing Business/Product row matches on, so it's immutable after create.
// Re-parenting a category is rare enough, and risky enough (it changes which
// businesses a parent-level filter picks up), that it's left out of this
// simple edit — delete and recreate under the right parent instead.
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}
