// auth.controller.ts — defines the actual HTTP routes: register, login, logout, forgot-password, reset-password, me.
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// Who/where a request came from -- recorded with each audit event.
function ctxOf(req: Request) {
  return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

const ACCESS_TOKEN_COOKIE = 'accessToken';
const ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days — matches the JWT's own expiresIn

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Tighter than the global default (60/min) -- unauthenticated write route,
  // no reason a real user needs more than a handful of signup attempts/min.
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, ctxOf(req));
  }

  // The classic brute-force target -- kept tight and per-IP.
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, role, user } = await this.authService.login(dto, ctxOf(req));
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Admins get a session cookie (no maxAge): the browser drops it when it
      // closes, so an admin must sign in again next time. Owners stay 7 days.
      ...(role === 'admin' ? {} : { maxAge: ACCESS_TOKEN_MAX_AGE_MS }),
    });
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { message: 'Logged out.' };
  }

  // Tightest limit on this controller -- this one sends an email, so a loose
  // limit lets someone spam another person's inbox, not just hammer the API.
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto, ctxOf(req));
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(dto, ctxOf(req));
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) {
    return this.authService.verifyEmail(dto, ctxOf(req));
  }

  // Sends an email, so it gets the same tight limit as forgot-password.
  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resendVerification(@Body() dto: ResendVerificationDto, @Req() req: Request) {
    return this.authService.resendVerification(dto, ctxOf(req));
  }

  // Signs the account out on every device (not just this browser).
  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logoutAll(req.user.userId, ctxOf(req));
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req) {
    return req.user;
  }
}