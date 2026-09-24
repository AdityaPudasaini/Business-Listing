// app.module.ts — the root module. Register every new feature module here (AuthModule is already wired up).
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}