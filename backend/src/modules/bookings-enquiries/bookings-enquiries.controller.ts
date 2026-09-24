// bookings-enquiries.controller.ts
// Routes:
//   GET    /bookings              — the logged-in user's own bookings
//   GET    /bookings/received     — bookings made on listings the caller owns (owner's request page)
//   POST   /bookings              — create a booking/enquiry, guest or logged-in
//   PATCH  /bookings/:id/status   — business owner (or admin) confirms or declines a booking
//   PATCH  /bookings/:id/cancel   — the customer cancels one of their own bookings
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

  @Get('received')
  @UseGuards(JwtAuthGuard)
  findReceived(@Req() req) {
    return this.bookingsEnquiriesService.findReceivedForOwner(req.user.userId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() dto: CreateBookingDto, @Req() req) {
    return this.bookingsEnquiriesService.create(req.user?.userId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto, @Req() req) {
    return this.bookingsEnquiriesService.updateStatus(id, dto.status, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @Req() req) {
    return this.bookingsEnquiriesService.cancel(id, req.user.userId);
  }
}
