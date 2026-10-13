// auth.service.ts — the actual business logic for register, login, forgot-password, and reset-password.
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { AuditService, RequestContext } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes
const BCRYPT_ROUNDS = 12; // older cost-10 hashes still verify; they are not re-hashed
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 1000 * 60 * 15; // 15 minutes

// Compared against when the email doesn't exist, so "unknown email" takes as long
// as "wrong password" and response time can't reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

// Only the hash of a reset token is stored, so a database leak can't be used to
// reset anyone's password. The raw token exists only in the emailed link.
function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: MailService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext = {}) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });
    void this.audit.log({ action: 'auth.register', userId: user.id, ...ctx });
    return { id: user.id, name: user.name, email: user.email };
  }

  async login(dto: LoginDto, ctx: RequestContext = {}) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Temporary lockout after too many wrong passwords. Checked before the password,
    // so a locked account can't be used to keep guessing.
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      void this.audit.log({ action: 'auth.login_blocked', userId: user.id, ...ctx });
      throw new HttpException(
        'Too many failed attempts. Please try again in a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const passwordOk = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordOk) {
      if (user) {
        await this.recordFailedLogin(user.id, ctx);
      } else {
        void this.audit.log({
          action: 'auth.login_failed',
          metadata: { email: String(dto.email).slice(0, 254) },
          ...ctx,
        });
      }
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned.');
    }

    if (user.failedLogins > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }
    void this.audit.log({ action: 'auth.login_success', userId: user.id, ...ctx });

    // tv = token version: bumping user.tokenVersion later invalidates this token.
    // Admin tokens are short-lived (the controller also makes their cookie end
    // with the browser session); everyone else keeps the module default (7d).
    const accessToken =
      user.role === 'admin'
        ? this.jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion }, { expiresIn: '8h' })
        : this.jwt.sign({ sub: user.id, role: user.role, tv: user.tokenVersion });
    return {
      accessToken,
      role: user.role,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, ctx: RequestContext = {}) {
    // Always return the same response, whether or not the email exists — this avoids leaking which emails are registered.
    const response = { message: 'If that email exists, a reset link has been sent.' };

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return response;

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashToken(resetToken),
        resetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    void this.audit.log({ action: 'auth.password_reset_requested', userId: user.id, ...ctx });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const link = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Deliberately not awaited: a slow SMTP server would otherwise make "email
    // exists" measurably slower than "email doesn't exist". MailService never throws.
    void this.mail.send({
      to: user.email,
      subject: 'Reset your password',
      text: `Hi ${user.name},\n\nUse this link to choose a new password:\n${link}\n\nThe link expires in 30 minutes. If you didn't ask for this, you can ignore this email.`,
      html: `<p>Hi ${escapeHtml(user.name)},</p><p><a href="${link}">Choose a new password</a></p><p>Or paste this link into your browser:<br>${link}</p><p>The link expires in 30 minutes. If you didn't ask for this, you can ignore this email.</p>`,
    });

    return response;
  }

  async resetPassword(dto: ResetPasswordDto, ctx: RequestContext = {}) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: hashToken(dto.token), resetExpires: { gt: new Date() } },
    });
    if (!user) throw new UnauthorizedException('Reset token is invalid or has expired');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
        // A password reset signs the account out everywhere and clears any lockout.
        tokenVersion: { increment: 1 },
        failedLogins: 0,
        lockedUntil: null,
      },
    });
    void this.audit.log({ action: 'auth.password_reset', userId: user.id, ...ctx });
    return { message: 'Password has been reset successfully.' };
  }

  // "Log out everywhere": every token issued so far stops working on its next request.
  async logoutAll(userId: string, ctx: RequestContext = {}) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    void this.audit.log({ action: 'auth.logout_all', userId, ...ctx });
    return { message: 'Logged out of all devices.' };
  }

  private async recordFailedLogin(userId: string, ctx: RequestContext) {
    const { failedLogins } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    void this.audit.log({ action: 'auth.login_failed', userId, ...ctx });
    if (failedLogins >= MAX_FAILED_LOGINS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
      });
      void this.audit.log({ action: 'auth.account_locked', userId, ...ctx });
    }
  }
}
