// customers.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CustomersService } from './customers.service';
import { SendCustomerMessageDto } from './dto/send-customer-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('businesses')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Declared before ':id/customers' so the literal "mine" segment is never
  // swallowed by the dynamic :id route below.
  @Get('mine/customers')
  mine(@Req() req) {
    return this.customersService.forOwner(req.user.userId);
  }

  @Get(':id/customers')
  forBusiness(@Param('id') businessId: string, @Req() req) {
    return this.customersService.forBusiness(businessId, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  // Personal message to one customer: emailed to them and saved to the thread.
  // Owner of the business or an admin; the customer must have booked/reviewed it.
  @Post(':id/customers/:customerId/messages')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  sendMessage(
    @Param('id') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: SendCustomerMessageDto,
    @Req() req,
  ) {
    return this.customersService.sendMessage(businessId, customerId, dto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }
}