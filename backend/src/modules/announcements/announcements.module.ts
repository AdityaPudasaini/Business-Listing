// announcements.module.ts
// Wires the controller and service together. Register in app.module.ts.
// MailService comes from the global MailModule — no need to import it here.
import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}