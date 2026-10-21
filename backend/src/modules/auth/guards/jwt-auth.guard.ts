// jwt-auth.guard.ts — attach this to any route with @UseGuards(JwtAuthGuard) to require a valid login token.
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
