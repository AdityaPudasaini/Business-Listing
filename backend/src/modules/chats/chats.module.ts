import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { AiReplyService } from './ai-reply.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [
    // Rate limiting is scoped to the chat routes only (the ThrottlerGuard is
    // applied in the controller), so nothing else in the API changes. This is
    // the default bucket; the two public write routes override it below.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    ListingsModule,
  ],
  controllers: [ChatsController],
  providers: [ChatsService, AiReplyService],
})
export class ChatsModule {}