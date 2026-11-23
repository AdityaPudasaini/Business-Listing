// setup.service.ts -- first-run installer: creates the FIRST admin account, once.
//
// Security model (read this before changing anything):
//  * "Installed" means "an admin account exists". There is no flag to flip back, so the page
//    cannot be re-opened by editing a setting; only deleting every admin would re-open it.
//  * Installing needs SETUP_CODE from the server's .env (install.sh generates it and shows it
//    only in the server terminal). Without it the feature is OFF: whoever reaches /install first
//    after DNS goes live cannot take over the site.
//  * The check "no admin yet" and the insert happen in ONE transaction guarded by a Postgres
//    advisory lock, so two simultaneous requests can never both create an admin.
//  * Once an admin exists every call answers 404, and nothing is revealed about the code.
//  * The password and the setup code are never logged or written to the audit log.
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService, RequestContext } from '../audit/audit.service';
import { InstallDto } from './dto/install.dto';
import { DEFAULT_CATEGORIES } from './default-categories';

const BCRYPT_ROUNDS = 12; // same cost as auth.service.ts
const MIN_CODE_LENGTH = 16;
const INSTALL_LOCK_KEY = 73401250; // arbitrary constant for pg_advisory_xact_lock

// Compare two strings without leaking, through timing, how many leading characters matched.
// Hashing first gives both sides the same length, which timingSafeEqual requires.
export function codesMatch(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}

@Injectable()
export class SetupService implements OnModuleInit {
  private readonly logger = new Logger(SetupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    // Say once at startup whether the installer is usable, without printing the code.
    if (!this.configuredCode()) {
      this.logger.log('Web installer is OFF (SETUP_CODE is not set or shorter than 16 characters).');
    }
  }

  private configuredCode(): string | null {
    const code = process.env.SETUP_CODE?.trim();
    return code && code.length >= MIN_CODE_LENGTH ? code : null;
  }

  private async hasAdmin(): Promise<boolean> {
    return (await this.prisma.user.count({ where: { role: 'admin' } })) > 0;
  }

  // A new site has no categories, so the category filter and the home page would be empty. Add the
  // starter set, once, and only when the table is empty (a restored backup keeps its own). It runs
  // in the same transaction as the admin insert: both happen, or neither.
  private async seedDefaultCategories(tx: Prisma.TransactionClient) {
    if ((await tx.category.count()) > 0) return;
    for (const c of DEFAULT_CATEGORIES) {
      await tx.category.upsert({ where: { id: c.id }, update: {}, create: c });
    }
  }

  // Safe to expose: it only says whether the site is installed.
  async status() {
    return { installed: await this.hasAdmin() };
  }

  async install(dto: InstallDto, ctx: RequestContext = {}) {
    // 1. Already installed (or the feature is off): behave as if the route did not exist.
    const expected = this.configuredCode();
    if (!expected || (await this.hasAdmin())) throw new NotFoundException();

    // 2. Wrong code. Constant-time compare; the route is also rate limited.
    if (!codesMatch(dto.setupCode, expected)) {
      void this.audit.log({ action: 'setup.install.rejected', ...ctx });
      throw new ForbiddenException('Invalid setup code.');
    }

    // 3. Create the admin. The lock + re-check make "first admin only" race-proof.
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const admin = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${INSTALL_LOCK_KEY})`;

      if ((await tx.user.count({ where: { role: 'admin' } })) > 0) throw new NotFoundException();
      if (await tx.user.findUnique({ where: { email: dto.email } })) {
        throw new ConflictException('That email is already registered.');
      }

      const created = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email,
          passwordHash,
          role: 'admin',
          emailVerified: true, // so a site with no working email yet is not locked out
        },
        select: { id: true },
      });
      await this.seedDefaultCategories(tx);
      return created;
    });

    void this.audit.log({ action: 'setup.install', userId: admin.id, targetType: 'user', targetId: admin.id, ...ctx });
    // The page then signs in through the normal /auth/login, so there is one login code path.
    return { installed: true };
  }
}
