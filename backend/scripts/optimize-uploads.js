#!/usr/bin/env node
// scripts/optimize-uploads.js -- shrink the images that are ALREADY in the uploads folder.
//
//   node scripts/optimize-uploads.js                    dry run: shows what would change, writes nothing
//   node scripts/optimize-uploads.js --confirm          do it
//
// TWO MODES
//
// 1) Default: each file keeps its NAME and FORMAT, so no link in the database changes. Only
//    the pixel size (longest side at most 1920 px) and the compression change. A file is
//    replaced only if the result is clearly smaller. This helps big JPEGs and WebPs, but
//    barely helps PNG photographs (PNG is lossless).
//
// 2) --convert: converts PNG and JPEG photos to WebP (typically 80 to 90 percent smaller) and
//    updates the database to point at the new files, in one all-or-nothing transaction. Only
//    photos that a database record actually uses are converted. The old files are left in
//    place so cached pages keep working; run again with --remove-originals a day later.
//      node scripts/optimize-uploads.js --convert                      preview (also reads the database)
//      node scripts/optimize-uploads.js --convert --confirm            do it
//      node scripts/optimize-uploads.js --remove-originals --confirm   later: clear the old files
//    TAKE A DATABASE BACKUP FIRST (ops/backup).
//
// Before anything is replaced, originals are copied to a folder next to uploads, named
// uploads-originals-<date>, so the change can be undone.
//
// Options:
//   --dir=<path>     folder to process (default: $UPLOAD_DIR, else ./uploads)
//   --max=1920       longest side in pixels
//   --quality=82     JPEG / WebP quality
//   --palette        (default mode) also compress PNGs lossily
//   --no-backup      do not keep the originals (not recommended)
//
// Safe to run twice: files that are already done are skipped.
try { require('dotenv/config'); } catch { /* env already set */ }
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const CONFIRM = process.argv.includes('--confirm');
const CONVERT = process.argv.includes('--convert');
const REMOVE_ORIGINALS = process.argv.includes('--remove-originals');
const PALETTE = process.argv.includes('--palette');
const BACKUP = !process.argv.includes('--no-backup');
const MAX = Number(arg('max', 1920));
const QUALITY = Number(arg('quality', 82));
const DIR = path.resolve(arg('dir', process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')));
const SKIP_UNDER_BYTES = 300 * 1024; // already small enough: leave alone
const MIN_SAVING = 0.10; // replace only if at least 10 percent smaller

const mb = (bytes) => (bytes / 1048576).toFixed(2);
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

function encoderFor(pipeline, ext) {
  if (ext === '.png') {
    return pipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      ...(PALETTE ? { palette: true, quality: 90, effort: 7 } : {}),
    });
  }
  if (ext === '.jpg' || ext === '.jpeg') return pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  return pipeline.webp({ quality: QUALITY, effort: 4 });
}

async function shrink(buffer, ext) {
  // .rotate() applies the EXIF orientation; metadata (including GPS) is dropped by default.
  const pipeline = sharp(buffer, { failOn: 'error', limitInputPixels: 80_000_000 })
    .rotate()
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
  return encoderFor(pipeline, ext).toBuffer();
}

(async () => {
  if (!Number.isFinite(MAX) || MAX < 400 || !Number.isFinite(QUALITY) || QUALITY < 40 || QUALITY > 100) {
    console.error('--max must be at least 400 and --quality between 40 and 100.');
    process.exit(1);
  }
  if (!fs.existsSync(DIR)) {
    console.error(`Uploads folder not found: ${DIR}\nRun this from the backend folder, or pass --dir=<path>.`);
    process.exit(1);
  }

  if (CONVERT || REMOVE_ORIGINALS) {
    const { PrismaClient, Prisma } = require('@prisma/client');
    const { runConvert } = require('./lib/convert-uploads');
    const prisma = new PrismaClient();
    let exitCode = 0;
    try {
      const result = await runConvert({
        dir: DIR, prisma, models: Prisma.dmmf.datamodel.models,
        confirm: CONFIRM, convert: CONVERT, removeOriginals: REMOVE_ORIGINALS, backup: BACKUP, max: MAX, quality: QUALITY,
      });
      exitCode = result.failed ? 1 : 0;
    } finally {
      await prisma.$disconnect();
    }
    process.exit(exitCode);
  }

  const files = fs.readdirSync(DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  console.log(`${CONFIRM ? 'OPTIMISING' : 'DRY RUN (nothing is written)'}: ${files.length} image(s) in ${DIR}`);
  console.log(`Longest side <= ${MAX}px, quality ${QUALITY}${PALETTE ? ', lossy PNG palette on' : ''}\n`);

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupDir = path.join(path.dirname(DIR), `uploads-originals-${stamp}`);
  if (CONFIRM && BACKUP) fs.mkdirSync(backupDir, { recursive: true });

  let before = 0, after = 0, changed = 0, skipped = 0, failed = 0;
  for (const name of files) {
    const file = path.join(DIR, name);
    const ext = path.extname(name).toLowerCase();
    const original = fs.readFileSync(file); // read into memory, so Windows keeps no file lock
    before += original.length;
    try {
      const meta = await sharp(original, { failOn: 'error' }).metadata();
      const small = Math.max(meta.width || 0, meta.height || 0) <= MAX && original.length < SKIP_UNDER_BYTES;
      if (small) { after += original.length; skipped++; continue; }

      const result = await shrink(original, ext);
      if (result.length > original.length * (1 - MIN_SAVING)) {
        after += original.length; skipped++;
        console.log(`  skip    ${name}  ${kb(original.length)} (would only reach ${kb(result.length)})`);
        continue;
      }

      console.log(`  shrink  ${name}  ${meta.width}x${meta.height}  ${kb(original.length)} -> ${kb(result.length)}`);
      after += result.length; changed++;
      if (CONFIRM) {
        if (BACKUP) fs.copyFileSync(file, path.join(backupDir, name));
        const temp = `${file}.tmp`;
        fs.writeFileSync(temp, result);
        fs.renameSync(temp, file); // replace in one step, never a half-written file
      }
    } catch (error) {
      failed++;
      after += original.length;
      console.log(`  FAILED  ${name}: ${error.message} (left untouched)`);
    }
  }

  console.log(`\n${files.length} files: ${changed} ${CONFIRM ? 'shrunk' : 'would be shrunk'}, ${skipped} left as they are, ${failed} failed.`);
  console.log(`Size: ${mb(before)} MB -> ${mb(after)} MB  (saves ${mb(before - after)} MB, ${before ? Math.round(((before - after) / before) * 100) : 0}%)`);
  if (!CONFIRM && changed) console.log('\nLooks right? Run it again with --confirm to apply.');
  if (CONFIRM && BACKUP && changed) console.log(`\nOriginals were copied to: ${backupDir}\nIf you are happy with the result, you can delete that folder later.`);
  process.exit(failed ? 1 : 0);
})().catch((error) => { console.error(error.message); process.exit(1); });
