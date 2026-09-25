// chats.controller.ts
// Routes:
//   POST /chats                — start a chat session for a listing, guest or logged-in
//   POST /chats/:id/messages   — visitor sends a message, gets the bot's reply (or is told a human has taken over)
//   GET  /chats/received       — owner: every chat session across their listings
//   GET  /chats/admin/all      — admin: every chat session on every listing
//   GET  /chats/:id/messages   — visitor polling: full thread + takenOver/endedAt
//   POST /chats/:id/reply      — owner of that listing, or an admin, replies as themselves
//   POST /chats/:id/end        — visitor ends the chat (no more messages either way)
//   POST /chats/:id/close      — owner of that listing, or an admin, ends the chat
//
// The public routes (start, sendMessage, getMessages, end) are rate limited
// per IP address — over the limit -> HTTP 429. Limits are per minute.
import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChatsService } from './chats.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('chats')
@UseGuards(ThrottlerGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
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

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAllForAdmin() {
    return this.chatsService.findAllForAdmin();
  }

  // Visitor polling: no JWT (guests have none) — the unguessable session id
  // is the access token, same as sendMessage/end below.
  @Get(':id/messages')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getMessages(@Param('id') id: string) {
    return this.chatsService.getMessages(id);
  }

  @Post(':id/end')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  end(@Param('id') id: string) {
    return this.chatsService.end(id);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard)
  close(@Param('id') id: string, @Req() req) {
    return this.chatsService.close(id, req.user);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard)
  reply(@Param('id') id: string, @Body() dto: SendChatMessageDto, @Req() req) {
    return this.chatsService.reply(id, req.user, dto);
  }
}
