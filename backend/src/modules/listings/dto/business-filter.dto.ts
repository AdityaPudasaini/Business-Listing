import { IsOptional, IsString } from 'class-validator';

export class BusinessFilterDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;
}