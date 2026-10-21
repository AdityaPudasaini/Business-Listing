// prisma/import-wordpress-users.ts
// One-off: create accounts for the WordPress business owners and (optionally)
// hand each owner their own imported listing.
//
//   npx ts-node prisma/import-wordpress-users.ts --dry-run
//   npx ts-node prisma/import-wordpress-users.ts
//   npx ts-node prisma/import-wordpress-users.ts --assign-listings --from-owner=you@example.com
//
// Flags:
//   --dry-run                 Print what would happen; writes nothing.
//   --assign-listings         Also move each owner's imported listing to them.
//                             Requires --from-owner (the account that currently owns the imports).
//   --from-owner=<email>      Only listings currently owned by this account are moved.
//
// Passwords: WordPress password hashes (phpass) can't be used by this app, so every
// account gets a random, unusable password. Owners sign in via "Forgot password".
// Nothing is emailed by this script. Safe to re-run (existing emails are reused).
try { require('dotenv/config'); } catch { /* env already loaded */ }
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
const flag = (n: string) => process.argv.includes(`--${n}`);
const DRY = flag('dry-run');
const ASSIGN = flag('assign-listings');
const FROM_EMAIL = arg('from-owner');

type Owner = { wpLogin: string; name: string; email: string; listings: string[] };

async function main() {
  if (ASSIGN && !FROM_EMAIL) throw new Error('--assign-listings needs --from-owner=<email>');
  const fromOwner = FROM_EMAIL ? await prisma.user.findUnique({ where: { email: FROM_EMAIL } }) : null;
  if (ASSIGN && !fromOwner) throw new Error(`No user with email ${FROM_EMAIL}`);

  const owners: Owner[] = JSON.parse(await readFile(join(__dirname, 'data', 'wordpress-owners.json'), 'utf8'));
  console.log(`${DRY ? '[DRY RUN] ' : ''}${owners.length} WordPress owners${ASSIGN ? ' (+ assigning listings)' : ''}`);
  let created = 0, existing = 0, moved = 0, failed = 0;

  for (const o of owners) {
    try {
      let user = await prisma.user.findUnique({ where: { email: o.email } });
      if (user) { existing++; console.log(`- exists: ${o.email}`); }
      else if (DRY) { created++; console.log(`✓ would create: ${o.name} <${o.email}>`); }
      else {
        const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
        user = await prisma.user.create({ data: { name: o.name, email: o.email, passwordHash, role: 'user' } });
        created++; console.log(`✓ created: ${o.name} <${o.email}>`);
      }

      if (ASSIGN) {
        for (const title of o.listings) {
          const biz = await prisma.business.findFirst({ where: { name: title, ownerId: fromOwner!.id } });
          if (!biz) { console.log(`    (no listing "${title}" owned by ${FROM_EMAIL} — skipped)`); continue; }
          if (DRY || !user) { moved++; console.log(`    would assign "${title}"`); continue; }
          await prisma.business.update({ where: { id: biz.id }, data: { ownerId: user.id } });
          moved++; console.log(`    assigned "${title}"`);
        }
      }
    } catch (e) { failed++; console.error(`✗ ${o.email}: ${(e as Error).message}`); }
  }
  console.log(`\nDone. created=${created} existing=${existing} listingsMoved=${moved} failed=${failed}${DRY ? ' (dry run)' : ''}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
