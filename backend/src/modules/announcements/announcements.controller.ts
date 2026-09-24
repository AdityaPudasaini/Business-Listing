// announcements.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { SendAnnouncementDto } from './dto/send-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('businesses/:id/announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  send(@Param('id') businessId: string, @Body() dto: SendAnnouncementDto, @Req() req) {
    return this.announcementsService.send(businessId, dto, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }

  @Get()
  history(@Param('id') businessId: string, @Req() req) {
    return this.announcementsService.history(businessId, {
      userId: req.user.userId,
      role: req.user.role,
    });
  }
}