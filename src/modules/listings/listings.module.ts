// listings.module.ts
// Wires the controller and service together. Already registered in app.module.ts — no changes needed here.
import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService],
})
export class ListingsModule {}
