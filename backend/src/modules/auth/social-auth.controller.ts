// social-auth.controller.ts — the browser-facing redirect routes for Google / Facebook login.
// These are opened by navigating the browser to them (not fetch/XHR), so they answer with redirects.
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { SocialAuthError, SocialAuthService, SocialProvider } from './social-auth.service';

const STATE_COOKIE = 'bl_oauth_state';
const COOKIE_PATH = '/auth';

function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function safeEqual(a: string, b: string) {
  const left = new Uint8Array(Buffer.from(a));
  const right = new Uint8Array(Buffer.from(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

@Controller('auth')
export class SocialAuthController {
  constructor(private readonly social: SocialAuthService) {}

  @Get('google')
  google(@Res() res: Response) {
    return this.start('google', res);
  }

  @Get('google/callback')
  googleCallback(@Query() query: Record<string, string>, @Req() req: Request, @Res() res: Response) {
    return this.finish('google', query, req, res);
  }

  @Get('facebook')
  facebook(@Res() res: Response) {
    return this.start('facebook', res);
  }

  @Get('facebook/callback')
  facebookCallback(@Query() query: Record<string, string>, @Req() req: Request, @Res() res: Response) {
    return this.finish('facebook', query, req, res);
  }

  private start(provider: SocialProvider, res: Response) {
    if (!this.social.isConfigured(provider)) {
      return res.redirect(this.social.frontendCallbackUrl({ error: 'provider_not_configured' }));
    }

    // `state` ties the callback to *this* browser: it's echoed back by the provider and
    // must match an httpOnly cookie, which stops someone else's login being forced on the user.
    const state = crypto.randomBytes(24).toString('hex');
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.social.redirectUri(provider).startsWith('https://'),
      maxAge: 10 * 60 * 1000,
      path: COOKIE_PATH,
    });
    return res.redirect(this.social.buildAuthUrl(provider, state));
  }

  private async finish(
    provider: SocialProvider,
    query: Record<string, string>,
    req: Request,
    res: Response,
  ) {
    const expectedState = readCookie(req.headers.cookie, STATE_COOKIE);
    res.clearCookie(STATE_COOKIE, { path: COOKIE_PATH });

    if (query.error) {
      return res.redirect(this.social.frontendCallbackUrl({ error: 'access_denied' }));
    }
    if (!query.code || !query.state || !expectedState || !safeEqual(query.state, expectedState)) {
      return res.redirect(this.social.frontendCallbackUrl({ error: 'invalid_state' }));
    }

    try {
      const token = await this.social.loginWithCode(provider, query.code);
      return res.redirect(this.social.frontendCallbackUrl({ token }));
    } catch (error) {
      const code = error instanceof SocialAuthError ? error.code : 'login_failed';
      console.error(`[auth] ${provider} login failed:`, (error as Error).message);
      return res.redirect(this.social.frontendCallbackUrl({ error: code }));
    }
  }
}