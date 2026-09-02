// auth.service.ts — the actual business logic for register, login, forgot-password, and reset-password.
import * as nodemailer from 'nodemailer';
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

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
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return { accessToken, user: { id: user.id, name: user.name, email: user.email } };
  }

async forgotPassword(dto: ForgotPasswordDto) {
  const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
  // Always return the same response, whether or not the email exists — this avoids leaking which emails are registered.
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await this.prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetExpires },
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: '"Business Listing" <no-reply@businesslisting.test>',
    to: user.email,
    subject: 'Password Reset Request',
    text: `Your password reset token is: ${resetToken}\n\nThis token expires in 30 minutes.`,
    html: `<p>Your password reset token is:</p><p><strong>${resetToken}</strong></p><p>This token expires in 30 minutes.</p>`,
  });

  console.log('Reset email preview URL:', nodemailer.getTestMessageUrl(info));

  return { message: 'If that email exists, a reset link has been sent.' };
}

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: dto.token, resetExpires: { gt: new Date() } },
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
