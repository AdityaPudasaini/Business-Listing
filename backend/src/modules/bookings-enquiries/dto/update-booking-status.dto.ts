// update-booking-status.dto.ts
import { IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn(['pending', 'confirmed', 'rejected'])
  status: string;
}