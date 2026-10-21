import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { httpUrlOptions, imageUrlOptions, isProvided } from './listing-validators';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ValidateIf(isProvided)
  @IsUrl(imageUrlOptions)
  image?: string | null;

  @ValidateIf(isProvided)
  @IsUrl(imageUrlOptions)
  coverImage?: string | null;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ValidateIf(isProvided)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl(imageUrlOptions, { each: true })
  gallery?: string[];

  @IsOptional()
  @IsObject()
  hours?: Record<string, { open: string; close: string } | null>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ValidateIf(isProvided)
  @IsUrl(httpUrlOptions)
  website?: string;

  @ValidateIf(isProvided)
  @IsUrl(httpUrlOptions)
  facebook?: string;

  @ValidateIf(isProvided)
  @IsUrl(httpUrlOptions)
  instagram?: string;

  @ValidateIf(isProvided)
  @IsUrl(httpUrlOptions)
  tiktok?: string;

  @ValidateIf(isProvided)
  @IsUrl(httpUrlOptions)
  linkedin?: string;

  @IsOptional()
  @IsBoolean()
  parkingAvailable?: boolean;

  // Admin-only: ListingsService.update() strips this for owners; adminUpdate() keeps it.
  @IsOptional()
  @IsBoolean()
  isPartner?: boolean;
}
