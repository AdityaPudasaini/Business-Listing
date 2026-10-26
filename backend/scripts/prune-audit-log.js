#!/usr/bin/env node
// scripts/prune-audit-log.js -- delete audit log rows older than a retention period.
//   node scripts/prune-audit-log.js                       -> dry run, 365-day retention
//   node scripts/prune-audit-log.js --days=180            -> dry run, 180 days
//   node scripts/prune-audit-log.js --days=180 --confirm  -> actually delete
// Run it from cron once a month. At least 30 days are always kept.
try { require('dotenv/config'); } catch { /* env already set */ }
const { PrismaClient } = require('@prisma/client');

const daysArg = process.argv.find((a) => a.startsWith('--days='));
const days = daysArg ? Number(daysArg.split('=')[1]) : 365;
const CONFIRM = process.argv.includes('--confirm');

(async () => {
  if (!Number.isFinite(days) || days < 30) {
    console.error('--days must be a number, 30 or more.');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where = { createdAt: { lt: cutoff } };
    const count = await prisma.auditLog.count({ where });
    console.log(`${count} audit log row(s) older than ${days} days (before ${cutoff.toISOString()}).`);
    if (!count) return;
    if (!CONFIRM) {
      console.log('Dry run. Re-run with --confirm to delete them.');
      return;
    }
    const result = await prisma.auditLog.deleteMany({ where });
    console.log(`Deleted ${result.count} row(s).`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
