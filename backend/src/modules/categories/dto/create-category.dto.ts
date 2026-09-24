import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  label!: string;

  // A key into the frontend's fixed icon lookup (e.g. "Wrench"), never a
  // free-form string rendered as-is — the frontend can't turn arbitrary text
  // into a component. Only meaningful on a sub-category today.
  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  // Omit for a top-level category. A provided parent must itself be
  // top-level — enforced in the service, not here, since it needs a DB read.
  @IsOptional()
  @IsString()
  parentId?: string;
}
