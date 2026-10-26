// scripts/lib/convert-uploads.js -- converts PNG/JPEG uploads to WebP and updates the database.
// Used by `npm run optimize-uploads -- --convert`. Takes its database client as a parameter so
// it can be tested without a real database.
//
// The order is chosen so that a failure at any point leaves the site working:
//   1. read what the database references (read-only)
//   2. copy the originals to a backup folder
//   3. write the new .webp files NEXT TO the originals (new names, nothing is overwritten)
//   4. update every database row in a single transaction (all or nothing)
//        -> if that fails, the new files are deleted again and the site is exactly as before
//   5. the old files stay where they are, so pages cached before the change keep working
//   6. only with removeOriginals: move old files that nothing references any more to the backup
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const refs = require('./image-references');

const baseName = (file) => file.slice(0, file.lastIndexOf('.'));
const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const mb = (bytes) => (bytes / 1048576).toFixed(2);
const MIN_SAVING = 0.15; // convert only if the WebP is at least 15 percent smaller

async function toWebp(buffer, { max, quality }) {
  return sharp(buffer, { failOn: 'error', limitInputPixels: 80_000_000 })
    .rotate() // apply the EXIF orientation; metadata (including GPS) is dropped by default
    .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();
}

async function runConvert({ dir, prisma, models, confirm, convert = true, removeOriginals = false, backup = true, max = 1920, quality = 82, log = console.log }) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupDir = path.join(path.dirname(dir), `uploads-originals-${stamp}`);
  const onDisk = fs.readdirSync(dir).sort();
  const sources = onDisk.filter((f) => /\.(png|jpe?g)$/i.test(f));
  const hasWebp = (f) => fs.existsSync(path.join(dir, `${baseName(f)}.webp`));

  // 1. What does the database actually use?
  const loaded = await refs.loadRows(prisma, models);
  const referenced = refs.referencedFiles(loaded);
  const unreferenced = sources.filter((f) => !referenced.has(f) && !hasWebp(f));
  // With convert=false (only --remove-originals) nothing new is converted.
  const candidates = convert ? sources.filter((f) => referenced.has(f) && !hasWebp(f)) : [];
  const done = sources.filter((f) => hasWebp(f));

  log(`${confirm ? (convert ? 'CONVERTING' : 'CLEANING UP') : 'DRY RUN (nothing is written)'}: ${sources.length} PNG/JPEG file(s) in ${dir}`);
  if (convert) log(`  ${candidates.length} are used by the database and not converted yet`);
  log(`  ${done.length} already have a .webp next to them`);
  log(`  ${unreferenced.length} are not used by any record (see the end)\n`);

  // 2. Prepare the WebP versions in memory
  const plan = [];
  let skippedNotWorth = 0;
  let failed = 0;
  for (const file of candidates) {
    const original = fs.readFileSync(path.join(dir, file));
    try {
      const meta = await sharp(original, { failOn: 'error' }).metadata();
      const result = await toWebp(original, { max, quality });
      if (result.length > original.length * (1 - MIN_SAVING)) {
        skippedNotWorth++;
        log(`  skip     ${file}  ${kb(original.length)} (WebP would be ${kb(result.length)}, not worth it)`);
        continue;
      }
      plan.push({ file, newFile: `${baseName(file)}.webp`, buffer: result, oldBytes: original.length, newBytes: result.length });
      log(`  convert  ${file}  ${meta.width}x${meta.height}  ${kb(original.length)} -> ${kb(result.length)}`);
    } catch (error) {
      failed++;
      log(`  FAILED   ${file}: ${error.message} (left untouched)`);
    }
  }

  const replacements = plan.map((p) => [`/files/${p.file}`, `/files/${p.newFile}`]);
  const { updates, perColumn } = refs.planChanges(loaded, replacements);
  const before = plan.reduce((sum, p) => sum + p.oldBytes, 0);
  const after = plan.reduce((sum, p) => sum + p.newBytes, 0);

  if (convert) {
    log(`\n${plan.length} file(s) ${confirm ? 'converted' : 'would be converted'}: ${mb(before)} MB -> ${mb(after)} MB` +
        `  (saves ${mb(before - after)} MB, ${before ? Math.round(((before - after) / before) * 100) : 0}%)`);
    log(`${updates.length} database row(s) ${confirm ? 'updated' : 'would be updated'}:`);
    for (const [column, count] of Object.entries(perColumn).sort()) log(`    ${column}: ${count}`);
  }
  if (skippedNotWorth || failed) log(`(${skippedNotWorth} left as they are because WebP would not help, ${failed} failed)`);

  if (!confirm) {
    if (plan.length) log('\nLooks right? Run it again with --confirm to apply. Take a database backup first.');
  } else if (plan.length) {
    // 3. Backup of the originals, then 4. the new files, then 5. all the rows in one transaction.
    if (backup) {
      fs.mkdirSync(backupDir, { recursive: true });
      for (const p of plan) fs.copyFileSync(path.join(dir, p.file), path.join(backupDir, p.file));
    }
    const written = [];
    try {
      for (const p of plan) {
        const target = path.join(dir, p.newFile);
        const temp = `${target}.tmp`;
        fs.writeFileSync(temp, p.buffer);
        fs.renameSync(temp, target);
        written.push(target);
      }
      await refs.applyChanges(prisma, updates);
    } catch (error) {
      for (const target of written) { try { fs.unlinkSync(target); } catch { /* already gone */ } }
      log(`\nERROR: ${error.message}\nNothing was changed: the new files were removed again and the database was not modified.`);
      throw error;
    }

    // Check the database no longer points at the old names.
    const stillUsed = refs.referencedFiles(await refs.loadRows(prisma, models));
    const leftovers = plan.filter((p) => stillUsed.has(p.file));
    if (leftovers.length) log(`\nWARNING: ${leftovers.length} old name(s) are still referenced somewhere, e.g. ${leftovers[0].file}`);
    log(`\nDone. The old files were left in place so pages cached a moment ago keep working.`);
    log(`Check the site, and in about a day run again with --remove-originals to clear the old files.`);
    if (backup) log(`Originals are also copied to: ${backupDir}`);
  }

  // 6. Optional clean-up: only files that nothing references any more, and that have a WebP twin.
  if (removeOriginals) {
    const nowUsed = refs.referencedFiles(await refs.loadRows(prisma, models));
    const removable = onDisk.filter((f) => /\.(png|jpe?g)$/i.test(f) && hasWebp(f) && !nowUsed.has(f));
    const freed = removable.reduce((sum, f) => sum + fs.statSync(path.join(dir, f)).size, 0);
    log(`\n${removable.length} old file(s) have a WebP copy and are not referenced any more (${mb(freed)} MB).`);
    if (!confirm) {
      if (removable.length) log('Run with --confirm to move them to the backup folder.');
    } else if (removable.length) {
      if (backup) fs.mkdirSync(backupDir, { recursive: true });
      for (const f of removable) {
        if (backup) fs.copyFileSync(path.join(dir, f), path.join(backupDir, f));
        fs.unlinkSync(path.join(dir, f));
      }
      log(`Moved ${removable.length} file(s)${backup ? ` to ${backupDir}` : ' (deleted, no backup)'}.`);
    }
  }

  if (unreferenced.length) {
    const orphanBytes = unreferenced.reduce((sum, f) => sum + fs.statSync(path.join(dir, f)).size, 0);
    log(`\n${unreferenced.length} PNG/JPEG file(s) (${mb(orphanBytes)} MB) are not used by any record, probably from deleted listings.`);
    log('They were left alone. If you are sure, they can be deleted to free space.');
  }
  return { converted: plan.length, rowsUpdated: updates.length, failed };
}

module.exports = { runConvert };
