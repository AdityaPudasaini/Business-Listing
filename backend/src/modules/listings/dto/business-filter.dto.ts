import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class BusinessFilterDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumberString()
  lat?: string;

  @IsOptional()
  @IsNumberString()
  lng?: string;

  @IsOptional()
  @IsNumberString()
  radiusKm?: string;
}