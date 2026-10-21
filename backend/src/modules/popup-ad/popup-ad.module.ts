import { Module } from '@nestjs/common';
import { PopupAdController } from './popup-ad.controller';
import { PopupAdService } from './popup-ad.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [PopupAdController],
  providers: [PopupAdService],
})
export class PopupAdModule {}
