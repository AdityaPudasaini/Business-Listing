// bookings-enquiries.controller.ts
// Routes:
//   GET    /bookings              — list the logged-in user's own bookings (done today)
//   POST   /bookings              — create a new booking/enquiry          (done today)
//   PATCH  /bookings/:id/status   — owner updates booking status          (second half)
import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { BookingsEnquiriesService } from './bookings-enquiries.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsEnquiriesController {
  constructor(private readonly bookingsEnquiriesService: BookingsEnquiriesService) {}

  @Get()
  findAll(@Req() req) {
    return this.bookingsEnquiriesService.findAllForUser(req.user.userId);
  }

  @Post()
  create(@Body() dto: CreateBookingDto, @Req() req) {
    return this.bookingsEnquiriesService.create(req.user.userId, dto);
  }
}