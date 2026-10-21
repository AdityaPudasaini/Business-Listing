// auth.module.ts — wires the controller, service, JWT config, and Passport strategy together.
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SocialAuthController } from './social-auth.controller';
import { SocialAuthService } from './social-auth.service';

@Module({
  imports: [
    PassportModule,
    // Read the secret through ConfigService so it's resolved AFTER .env is
    // loaded, instead of at import time (when process.env.JWT_SECRET was empty).
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController, SocialAuthController],
  providers: [AuthService, SocialAuthService, JwtStrategy],
})
export class AuthModule {}