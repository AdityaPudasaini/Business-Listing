// jwt.strategy.ts — tells Passport how to read and verify the JWT sent in the accessToken cookie.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

function extractFromCookie(req: Request): string | null {
  return (req?.cookies?.accessToken as string) || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // Re-check the database on every request so a ban or a role change takes
    // effect immediately, instead of lasting until the token expires.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isBanned: true },
    });
    if (!user || user.isBanned) {
      throw new UnauthorizedException();
    }
    // Whatever is returned here becomes `req.user` in any route protected by JwtAuthGuard.
    return { userId: user.id, role: user.role };
  }
}
