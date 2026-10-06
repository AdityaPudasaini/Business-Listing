// prisma/import-wordpress-reviews.ts
// One-off: bring the published WordPress "Site Reviews" over as real Review rows.
//
//   npx ts-node prisma/import-wordpress-reviews.ts --dry-run
//   npx ts-node prisma/import-wordpress-reviews.ts
//   npx ts-node prisma/import-wordpress-reviews.ts --use-real-emails      (see below)
//
// Flags:
//   --dry-run          Print what would happen; writes nothing.
//   --use-real-emails  Create reviewer accounts under the reviewer's real email.
//                      DEFAULT is privacy-friendly: each reviewer who has no account
//                      already gets a placeholder account whose email is
//                      wp-review-<id>@imported.invalid (cannot log in, receive mail,
//                      or be looked up by their real address). Only the display name
//                      and review text are carried over.
//
// Data: prisma/data/wordpress-reviews.json (gitignored — it contains reviewer emails).
// Only PUBLISHED WordPress reviews are in it; the 4 pending ones were spam.
//
// Rules this script follows (same as ReviewsService):
//   * one review per user per business (skips if it already exists -> safe to re-run)
//   * an owner never reviews their own listing (skipped)
// Listings are matched by exact name; if a name matches 0 or 2+ listings the review
// is reported and skipped rather than guessed.
// Afterwards Business.rating is recomputed (average) for every touched listing,
// exactly as ReviewsService.recalculateRating does. Nothing is emailed.
try { require('dotenv/config'); } catch { /* env already loaded */ }
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();
const flag = (n: string) => process.argv.includes(`--${n}`);
const DRY = flag('dry-run');
const REAL_EMAILS = flag('use-real-emails');

type WpReview = {
  wpReviewId: string;
  wpListingId: string;
  listingName: string;
  name: string;
  email: string;
  rating: number;
  title: string;
  content: string;
  postDate: string; // "YYYY-MM-DD HH:mm:ss", WordPress site time (Nepal)
};

// The export had at least one reviewer who left a dummy address.
const DUMMY_EMAILS = new Set(['noemail@gmail.com']);

// WordPress stored local (Nepal, UTC+05:45) time.
const toDate = (s: string) => new Date(s.replace(' ', 'T') + '+05:45');

async function findOrCreateReviewer(r: WpReview): Promise<{ id: string; how: string } | null> {
  // 1) A real account with this email already exists (e.g. an owner) -> reuse it.
  if (!DUMMY_EMAILS.has(r.email)) {
    const found = await prisma.user.findUnique({ where: { email: r.email } });
    if (found) return { id: found.id, how: `existing account` };
  }

  // 2) Otherwise a placeholder (default) or a real-email account (--use-real-emails).
  const email =
    REAL_EMAILS && !DUMMY_EMAILS.has(r.email) ? r.email : `wp-review-${r.wpReviewId}@imported.invalid`;
  const found = await prisma.user.findUnique({ where: { email } });
  if (found) return { id: found.id, how: 'previously imported account' };

  if (DRY) return { id: '(new)', how: `would create ${email}` };
  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const user = await prisma.user.create({
    data: { name: r.name || 'Customer', email, passwordHash, role: 'user' },
  });
  return { id: user.id, how: `created ${email}` };
}

async function main() {
  const reviews: WpReview[] = JSON.parse(
    await readFile(join(__dirname, 'data', 'wordpress-reviews.json'), 'utf8'),
  );
  console.log(
    `${DRY ? '[DRY RUN] ' : ''}${reviews.length} published WordPress reviews ` +
      `(${REAL_EMAILS ? 'real emails' : 'placeholder accounts'})`,
  );

  let created = 0, skipped = 0, failed = 0;
  const touched = new Set<string>();

  for (const r of reviews) {
    const label = `#${r.wpReviewId} "${r.title || '(no title)'}" by ${r.name} -> ${r.listingName}`;
    try {
      const matches = await prisma.business.findMany({ where: { name: r.listingName } });
      if (matches.length !== 1) {
        skipped++;
        console.log(`- skipped ${label}: ${matches.length} listings named "${r.listingName}"`);
        continue;
      }
      const biz = matches[0];

      const reviewer = await findOrCreateReviewer(r);
      if (!reviewer) { skipped++; continue; }
      if (reviewer.id === biz.ownerId) {
        skipped++;
        console.log(`- skipped ${label}: reviewer owns this listing`);
        continue;
      }

      if (reviewer.id !== '(new)') {
        const dup = await prisma.review.findFirst({ where: { businessId: biz.id, userId: reviewer.id } });
        if (dup) { skipped++; console.log(`- already imported ${label}`); continue; }
      }

      if (DRY) {
        created++;
        console.log(`✓ would import ${label}  [${r.rating}★, ${reviewer.how}]`);
      } else {
        await prisma.review.create({
          data: {
            businessId: biz.id,
            userId: reviewer.id,
            rating: r.rating,
            title: r.title || null,
            comment: r.content || null,
            createdAt: toDate(r.postDate),
          },
        });
        created++;
        console.log(`✓ imported ${label}  [${r.rating}★, ${reviewer.how}]`);
      }
      touched.add(biz.id);
    } catch (e) {
      failed++;
      console.error(`✗ ${label}: ${(e as Error).message}`);
    }
  }

  // Recompute Business.rating (average) exactly as ReviewsService does.
  if (!DRY) {
    for (const businessId of touched) {
      const agg = await prisma.review.aggregate({ where: { businessId }, _avg: { rating: true } });
      await prisma.business.update({ where: { id: businessId }, data: { rating: agg._avg.rating ?? 0 } });
    }
    console.log(`Recomputed rating for ${touched.size} listing(s).`);
  }

  console.log(`\nDone. imported=${created} skipped=${skipped} failed=${failed}${DRY ? ' (dry run)' : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
