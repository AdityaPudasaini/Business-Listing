// jwt.strategy.ts — tells Passport how to read and verify the JWT sent in the accessToken cookie.
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

function extractFromCookie(req: Request): string | null {
  return (req?.cookies?.accessToken as string) || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // Whatever is returned here becomes `req.user` in any route protected by JwtAuthGuard.
    return { userId: payload.sub, role: payload.role };
  }
}