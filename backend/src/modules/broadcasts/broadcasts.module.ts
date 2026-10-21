// broadcasts.module.ts
// MailService comes from the global MailModule — no need to import it here.
import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';

@Module({
  controllers: [BroadcastsController],
  providers: [BroadcastsService],
})
export class BroadcastsModule {}