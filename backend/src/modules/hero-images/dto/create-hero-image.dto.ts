import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateHeroImageDto {
  @IsString()
  @MinLength(1)
  url!: string;

  @IsOptional()
  @IsInt()
  order?: number;
}