// jwt.strategy.ts — tells Passport how to read and verify the JWT sent in the Authorization header.
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // Whatever is returned here becomes `req.user` in any route protected by JwtAuthGuard.
    return { userId: payload.sub, role: payload.role };
  }
}
