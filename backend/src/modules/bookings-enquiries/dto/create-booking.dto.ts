// create-booking.dto.ts
// Validates the body of POST /bookings
import { IsString, IsOptional, IsDateString, IsEmail, Matches, IsObject } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  businessId: string;

  @IsDateString()
  date: string; // e.g. "2026-09-25"

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'time must be in HH:mm 24-hour format, e.g. 18:30',
  })
  time: string;

  @IsOptional()
  @IsString()
  service?: string;

  @IsOptional()
  @IsObject()
  details?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}