import { Module } from '@nestjs/common';
import { HeroImagesController } from './hero-images.controller';
import { HeroImagesService } from './hero-images.service';

@Module({
  controllers: [HeroImagesController],
  providers: [HeroImagesService],
})
export class HeroImagesModule {}