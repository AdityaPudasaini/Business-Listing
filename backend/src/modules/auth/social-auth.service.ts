// social-auth.service.ts — "Log in with Google / Facebook" using the standard
// OAuth authorization-code flow, done with plain fetch (no extra packages).
//
// Flow: browser -> GET /auth/:provider -> provider consent screen ->
//       GET /auth/:provider/callback?code=... -> we swap the code for the
//       user's profile, find-or-create the user, and redirect to the frontend
//       with our own JWT in the URL fragment.
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type SocialProvider = 'google' | 'facebook';

// Codes the frontend's /auth/callback page knows how to explain to the user.
export type SocialErrorCode =
  | 'provider_not_configured'
  | 'access_denied'
  | 'invalid_state'
  | 'no_email'
  | 'email_unverified'
  | 'login_failed';

export class SocialAuthError extends Error {
  constructor(public readonly code: SocialErrorCode, message?: string) {
    super(message ?? code);
  }
}

interface SocialProfile {
  providerUserId: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
}

const FACEBOOK_API_VERSION = 'v21.0';

@Injectable()
export class SocialAuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // ---------- config ----------

  private get backendUrl() {
    return (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
  }

  get frontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  private credentials(provider: SocialProvider) {
    return provider === 'google'
      ? { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET }
      : { id: process.env.FACEBOOK_APP_ID, secret: process.env.FACEBOOK_APP_SECRET };
  }

  isConfigured(provider: SocialProvider) {
    const { id, secret } = this.credentials(provider);
    return Boolean(id && secret);
  }

  /** The URL that must be registered as an authorised redirect URI with the provider. */
  redirectUri(provider: SocialProvider) {
    return `${this.backendUrl}/auth/${provider}/callback`;
  }

  /** Where the browser is sent once we're done — success (token) or failure (error code). */
  frontendCallbackUrl(result: { token: string } | { error: SocialErrorCode }) {
    const base = `${this.frontendUrl}/auth/callback`;
    // The token goes in the fragment so it never reaches server logs or Referer headers.
    return 'token' in result ? `${base}#token=${result.token}` : `${base}?error=${result.error}`;
  }

  // ---------- step 1: send the user to the provider ----------

  buildAuthUrl(provider: SocialProvider, state: string) {
    const { id } = this.credentials(provider);

    if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: id!,
        redirect_uri: this.redirectUri('google'),
        response_type: 'code',
        scope: 'openid email profile',
        state,
        prompt: 'select_account',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    const params = new URLSearchParams({
      client_id: id!,
      redirect_uri: this.redirectUri('facebook'),
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    });
    return `https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth?${params}`;
  }

  // ---------- step 2: exchange the code, then log in ----------

  async loginWithCode(provider: SocialProvider, code: string) {
    const profile =
      provider === 'google' ? await this.fetchGoogleProfile(code) : await this.fetchFacebookProfile(code);
    const user = await this.findOrCreateUser(provider, profile);
    if (user.isBanned) {
      throw new UnauthorizedException('This account has been banned.');
    }
    return this.jwt.sign({ sub: user.id, role: user.role });
  }

  private async getJson(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new SocialAuthError('login_failed', body?.error_description ?? body?.error?.message ?? `HTTP ${res.status}`);
    }
    return body;
  }

  private async fetchGoogleProfile(code: string): Promise<SocialProfile> {
    const { id, secret } = this.credentials('google');

    const token = await this.getJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: id!,
        client_secret: secret!,
        redirect_uri: this.redirectUri('google'),
        grant_type: 'authorization_code',
      }),
    });

    const info = await this.getJson('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    return {
      providerUserId: String(info.sub),
      name: info.name || info.email || 'Google user',
      email: info.email ?? null,
      emailVerified: info.email_verified === true || info.email_verified === 'true',
    };
  }

  private async fetchFacebookProfile(code: string): Promise<SocialProfile> {
    const { id, secret } = this.credentials('facebook');

    const token = await this.getJson(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token?${new URLSearchParams({
        client_id: id!,
        client_secret: secret!,
        redirect_uri: this.redirectUri('facebook'),
        code,
      })}`,
    );

    const info = await this.getJson(
      `https://graph.facebook.com/me?${new URLSearchParams({
        fields: 'id,name,email',
        access_token: token.access_token,
      })}`,
    );

    return {
      providerUserId: String(info.id),
      name: info.name || info.email || 'Facebook user',
      email: info.email ?? null,
      // Facebook only returns an email address it has confirmed for the account.
      emailVerified: Boolean(info.email),
    };
  }

  // ---------- account linking ----------

  private async findOrCreateUser(provider: SocialProvider, profile: SocialProfile) {
    // 1. Returning social user.
    const linked = await this.prisma.socialAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } },
      include: { user: true },
    });
    if (linked) return linked.user;

    // 2. First time with this provider — we need a verified email to match or create an account.
    if (!profile.email) throw new SocialAuthError('no_email');
    if (!profile.emailVerified) throw new SocialAuthError('email_unverified');

    const email = profile.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existing) {
      // Same verified email as an existing account: link, so the person keeps their listings.
      await this.prisma.socialAccount.create({
        data: { provider, providerUserId: profile.providerUserId, userId: existing.id },
      });
      return existing;
    }

    // 3. Brand-new user. passwordHash is required by the schema, so store a hash of
    // random bytes nobody knows; they can set a real password via "Forgot password".
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    return this.prisma.user.create({
      data: {
        name: profile.name,
        email,
        passwordHash,
        socialAccounts: {
          create: { provider, providerUserId: profile.providerUserId },
        },
      },
    });
  }
}