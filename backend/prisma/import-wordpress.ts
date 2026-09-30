// prisma/import-wordpress.ts
// One-off import of the AutoHub Nepal WordPress listings.
//
//   npx ts-node prisma/import-wordpress.ts --owner=you@example.com --dry-run
//   npx ts-node prisma/import-wordpress.ts --owner=you@example.com
//
// Flags:
//   --owner=<email>   REQUIRED. Existing user who will own every imported listing.
//   --dry-run         Print what would happen; writes nothing, downloads nothing.
//   --approve         Create as status "approved" (live immediately). Default: "pending".
//   --skip-images     Don't download images (image fields stay empty).
//
// Safe to re-run: a listing is skipped if this owner already has one with the same name.
// Only wpStatus === "publish" entries are imported.
try { require('dotenv/config'); } catch { /* env already loaded (e.g. by prisma) */ }
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=');
const flag = (n: string) => process.argv.includes(`--${n}`);

const DRY = flag('dry-run');
const APPROVE = flag('approve');
const SKIP_IMAGES = flag('skip-images');
const OWNER_EMAIL = arg('owner');

const uploadDir = () => process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
const publicBase = () =>
  (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');

// Same as src/common/utils/slugify.ts (copied so this script stands alone).
const slugify = (t: string) =>
  t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function detectExt(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => buf[i] === b)) return 'png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

const imageCache = new Map<string, string | null>();
async function mirrorImage(url?: string | null): Promise<string | null> {
  if (!url || SKIP_IMAGES) return null;
  if (imageCache.has(url)) return imageCache.get(url)!;
  let result: string | null = null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = detectExt(buf);
    if (!ext) throw new Error('not a JPG/PNG/WebP');
    if (buf.length > 5 * 1024 * 1024) console.warn(`    (note: ${url} is over 5 MB)`);
    await mkdir(uploadDir(), { recursive: true });
    const name = `${randomBytes(16).toString('hex')}.${ext}`;
    await writeFile(join(uploadDir(), name), new Uint8Array(buf));
    result = `${publicBase()}/files/${name}`;
  } catch (e) {
    console.warn(`    image failed: ${url} -> ${(e as Error).message}`);
  }
  imageCache.set(url, result);
  return result;
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let candidate = base, n = 2;
  while (await prisma.business.findUnique({ where: { slug: candidate } })) candidate = `${base}-${n++}`;
  return candidate;
}

async function main() {
  if (!OWNER_EMAIL) throw new Error('Missing --owner=<email>');
  const owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) throw new Error(`No user with email ${OWNER_EMAIL}`);

  const all = JSON.parse(await readFile(join(__dirname, 'data', 'autohub-listings-extracted.json'), 'utf8'));
  const rows = all.filter((r: any) => r.wpStatus === 'publish');
  const categories = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));

  console.log(`${DRY ? '[DRY RUN] ' : ''}${rows.length} listings -> owner ${owner.email}, status ${APPROVE ? 'approved' : 'pending'}`);
  let created = 0, skipped = 0, failed = 0;

  for (const r of rows) {
    const d = r.dto;
    try {
      if (!categories.has(d.category)) {
        console.error(`✗ ${d.name}: category "${d.category}" not in DB (existing: ${[...categories].join(', ')})`);
        failed++; continue;
      }
      const dup = await prisma.business.findFirst({ where: { ownerId: owner.id, name: d.name } });
      if (dup) { console.log(`- skip (exists): ${d.name}`); skipped++; continue; }
      if (DRY) { console.log(`✓ would create: ${d.name} [${d.category}]${r.after_create.isPartner ? ' (partner)' : ''}`); created++; continue; }

      const image = await mirrorImage(d.image);
      const coverImage = await mirrorImage(d.coverImage);
      const gallery: string[] = [];
      for (const g of d.gallery ?? []) { const u = await mirrorImage(g); if (u) gallery.push(u); }

      await prisma.business.create({
        data: {
          ownerId: owner.id,
          name: d.name,
          slug: await uniqueSlug(d.name),
          category: d.category,
          location: d.location ?? '',
          latitude: d.latitude, longitude: d.longitude,
          description: d.description || null,
          image, coverImage, gallery,
          hours: d.hours ?? Prisma.DbNull,
          amenities: d.amenities, paymentMethods: d.paymentMethods, services: d.services,
          website: d.website, facebook: d.facebook, instagram: d.instagram, tiktok: d.tiktok, linkedin: d.linkedin,
          parkingAvailable: d.parkingAvailable,
          email: d.email, phone: d.phone, whatsapp: d.whatsapp,
          isPartner: !!r.after_create.isPartner,
          status: APPROVE ? 'approved' : 'pending',
        },
      });
      console.log(`✓ created: ${d.name}`);
      created++;
    } catch (e) {
      console.error(`✗ ${d.name}: ${(e as Error).message}`);
      failed++;
    }
  }
  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed}${DRY ? ' (dry run)' : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
