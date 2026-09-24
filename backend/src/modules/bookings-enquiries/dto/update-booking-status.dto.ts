// update-booking-status.dto.ts
// Validates the body of PATCH /bookings/:id/status (owner confirms or declines).
import { IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn(['confirmed', 'declined'])
  status: 'confirmed' | 'declined';
}
