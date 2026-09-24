// broadcasts.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { BroadcastsService } from './broadcasts.service';
import { SendBroadcastDto } from './dto/send-broadcast.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/broadcasts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  send(@Body() dto: SendBroadcastDto, @Req() req) {
    return this.broadcastsService.send(dto, req.user.userId);
  }

  @Get()
  history() {
    return this.broadcastsService.history();
  }
}