// auth.service.ts — the actual business logic for register, login, forgot-password, and reset-password.
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService, escapeHtml } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

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
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });
    return { id: user.id, name: user.name, email: user.email };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned.');
    }
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return { accessToken, user: { id: user.id, name: user.name, email: user.email } };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
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

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: hashToken(dto.token), resetExpires: { gt: new Date() } },
    });
    if (!user) throw new UnauthorizedException('Reset token is invalid or has expired');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetExpires: null },
    });
    return { message: 'Password has been reset successfully.' };
  }
}
