// app.module.ts — the root module. Register every new feature module here (AuthModule is already wired up).
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { BookingsEnquiriesModule } from './modules/bookings-enquiries/bookings-enquiries.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './modules/mail/mail.module';
import { ContactModule } from './modules/contact/contact.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HeroImagesModule } from './modules/hero-images/hero-images.module';
import { ChatsModule } from './modules/chats/chats.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { BroadcastsModule } from './modules/broadcasts/broadcasts.module';
import { CustomersModule } from './modules/customers/customers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global default: 60 requests/minute per IP on every route. Routes that
    // need a tighter (or looser) limit override it with their own
    // @Throttle({ default: { limit, ttl } }) decorator — see auth.controller.ts
    // and chats.controller.ts for examples. @SkipThrottle() exempts a route
    // entirely if one ever needs it.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    ListingsModule,
    ReviewsModule,
    BookingsEnquiriesModule,
    ProductsModule,
    UsersModule,
    ContactModule,
    UploadsModule,
    HeroImagesModule,
    ChatsModule,
    CategoriesModule,
    AnnouncementsModule,
    BroadcastsModule,
    CustomersModule,
  ],
  providers: [
    // Applies ThrottlerGuard to every route in the app, not just chats. Do
    // NOT also put @UseGuards(ThrottlerGuard) on individual controllers
    // anymore -- that would run the guard twice per request and effectively
    // halve whatever limit is configured.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}