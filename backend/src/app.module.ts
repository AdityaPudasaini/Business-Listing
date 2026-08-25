// app.module.ts — the root module. Register every new feature module here (AuthModule is already wired up).
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BookingsEnquiriesModule } from './modules/bookings-enquiries/bookings-enquiries.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ListingsModule,
    ReviewsModule,
    BookingsEnquiriesModule,
  ],
})
export class AppModule {}
