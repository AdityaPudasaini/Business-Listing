// chats.controller.ts
// Routes:
//   POST /chats                — start a chat session for a listing, guest or logged-in
//   POST /chats/:id/messages   — send a message, get the bot's reply
//   GET  /chats/received       — owner: every chat session across their listings
//
// The two POST routes are public, so they are rate limited per IP address
// (over the limit -> HTTP 429). Limits are per minute.
import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChatsService } from './chats.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chats')
@UseGuards(ThrottlerGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  start(@Body() dto: StartChatDto, @Req() req) {
    return this.chatsService.start(req.user?.userId, dto);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  sendMessage(@Param('id') id: string, @Body() dto: SendChatMessageDto) {
    return this.chatsService.sendMessage(id, dto);
  }

  @Get('received')
  @UseGuards(JwtAuthGuard)
  findForOwner(@Req() req) {
    return this.chatsService.findForOwner(req.user.userId);
  }
}