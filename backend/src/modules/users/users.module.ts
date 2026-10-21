// users.module.ts — owner account (/me/account) and admin user management
// (/users). Registered in app.module.ts.
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}