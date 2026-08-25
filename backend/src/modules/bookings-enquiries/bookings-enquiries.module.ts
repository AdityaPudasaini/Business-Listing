// bookings-enquiries.module.ts
// Wires the controller and service together. Already registered in app.module.ts — no changes needed here.
import { Module } from '@nestjs/common';
import { BookingsEnquiriesController } from './bookings-enquiries.controller';
import { BookingsEnquiriesService } from './bookings-enquiries.service';

@Module({
  controllers: [BookingsEnquiriesController],
  providers: [BookingsEnquiriesService],
})
export class BookingsEnquiriesModule {}
