// bookings-enquiries.controller.ts
// Routes:
//   GET    /bookings              — list the logged-in user's own bookings (done today)
//   POST   /bookings              — create a new booking/enquiry, guest or logged-in (done today)
//   PATCH  /bookings/:id/status   — business owner updates booking status
//   PATCH  /bookings/:id/cancel   — business owner cancels a booking
import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { BookingsEnquiriesService } from './bookings-enquiries.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('bookings')
export class BookingsEnquiriesController {
  constructor(private readonly bookingsEnquiriesService: BookingsEnquiriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req) {
    return this.bookingsEnquiriesService.findAllForUser(req.user.userId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateBookingDto, @Req() req) {
    return this.bookingsEnquiriesService.create(req.user?.userId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto, @Req() req) {
    return this.bookingsEnquiriesService.updateStatus(id, req.user.userId, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @Req() req) {
    return this.bookingsEnquiriesService.cancel(id, req.user.userId);
  }
}