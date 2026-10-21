#!/usr/bin/env node
// scripts/delete-test-users.js — delete the known seed/test accounts.
//   node scripts/delete-test-users.js            -> shows what WOULD be deleted (nothing changes)
//   node scripts/delete-test-users.js --confirm  -> actually deletes
// Refuses to delete any account that owns listings or has an admin role.
// NOTE: deleting a user also deletes their reviews, bookings and chat sessions (DB cascade).
try { require('dotenv/config'); } catch { /* env already set */ }
const { PrismaClient } = require('@prisma/client');

const EMAILS = [
  'seed.reviewer1@test.com', 'seed.reviewer2@test.com', 'seed.reviewer3@test.com',
  'reviewer1@test.com', 'reviewer2@test.com', 'cookietest@example.com',
];
const PATTERNS = [/^ratelimittest\+/i]; // "Rate Limit Test" accounts use a +random suffix
const CONFIRM = process.argv.includes('--confirm');

(async () => {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({
      include: { _count: { select: { Business: true, Review: true, Booking: true } } },
    });
    const targets = users.filter((u) => EMAILS.includes(u.email) || PATTERNS.some((p) => p.test(u.email)));
    if (!targets.length) { console.log('No matching test users found.'); return; }
    let deleted = 0;
    for (const u of targets) {
      const c = u._count;
      const line = `${u.email} (role ${u.role}; listings ${c.Business}, reviews ${c.Review}, bookings ${c.Booking})`;
      if (u.role === 'admin' || c.Business > 0) { console.log(`SKIP ${line} — admin or owns listings`); continue; }
      if (!CONFIRM) { console.log(`would delete ${line}`); continue; }
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`deleted ${line}`); deleted++;
    }
    console.log(CONFIRM ? `\nDone. deleted=${deleted}` : '\nDry run. Re-run with --confirm to delete.');
  } finally { await prisma.$disconnect(); }
})().catch((e) => { console.error(e.message); process.exit(1); });
