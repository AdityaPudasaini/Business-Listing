import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('businesses')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(@Query() filters: BusinessFilterDto) {
    return this.listingsService.findAll(filters);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  findPending(@Req() req) {
    return this.listingsService.findPending(req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBusinessDto, @Req() req) {
    return this.listingsService.create(dto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto, @Req() req) {
    return this.listingsService.update(id, dto, req.user.userId);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Req() req) {
    return this.listingsService.approve(id, req.user.role);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Req() req) {
    return this.listingsService.reject(id, req.user.role);
  }
}