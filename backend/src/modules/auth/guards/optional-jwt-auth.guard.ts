// optional-jwt-auth.guard.ts — like JwtAuthGuard, but never rejects the request.
// A valid token still populates req.user; a missing or invalid one just leaves
// req.user undefined instead of throwing 401. Used on routes that accept both
// logged-in users and guests (e.g. creating a booking).
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Normal JwtAuthGuard throws here if err or !user. We just return
    // whatever we got (possibly undefined) and let the request continue.
    return user || undefined;
  }

  // Override so an invalid/expired token doesn't trigger Passport's default
  // "unauthorized" flow before handleRequest even runs.
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as Promise<boolean>;
  }
}