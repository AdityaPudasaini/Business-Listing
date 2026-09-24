// customers.controller.ts
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
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
}