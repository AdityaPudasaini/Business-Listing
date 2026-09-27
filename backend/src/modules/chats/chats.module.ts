import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { AiReplyService } from './ai-reply.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  // Rate limiting is now global (ThrottlerModule + the APP_GUARD provider
  // live in app.module.ts). The per-route @Throttle() overrides below in
  // chats.controller.ts still apply on top of that global default.
  imports: [ListingsModule],
  controllers: [ChatsController],
  providers: [ChatsService, AiReplyService],
})
export class ChatsModule {}