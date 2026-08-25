// bookings-enquiries.controller.ts
// TODO: implement the routes below. Full working example is in the guideline docx, Part C, "Bookings / Enquiries Module".
// Routes to build:
//   GET    /bookings                    — list a user's bookings
//   POST   /bookings                    — create a new booking/enquiry
//   PATCH  /bookings/:id/status         — owner updates the booking status
import { Controller, Get } from '@nestjs/common';
import { BookingsEnquiriesService } from './bookings-enquiries.service';

@Controller('bookings')
export class BookingsEnquiriesController {
  constructor(private readonly bookingsenquiriesService: BookingsEnquiriesService) {}

  @Get()
  findAll() {
    // TODO: replace this placeholder with a real Prisma query once your model is in schema.prisma
    return this.bookingsenquiriesService.placeholder();
  }
}
