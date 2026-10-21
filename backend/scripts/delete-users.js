#!/usr/bin/env node
// scripts/delete-users.js — delete specific accounts by email.
//   node scripts/delete-users.js a@x.com b@y.com                 -> dry run (nothing changes)
//   node scripts/delete-users.js a@x.com b@y.com --confirm       -> actually delete
// Flags: --allow-owned (also delete accounts that own listings: their listings are deleted too)
//        --allow-admin (permit deleting an admin; the last remaining admin is never deleted)
// Deleting a user also deletes their reviews, bookings and chat sessions (DB cascade).
try { require('dotenv/config'); } catch { /* env already set */ }
const { PrismaClient } = require('@prisma/client');

const emails = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const has = (f) => process.argv.includes(f);
const CONFIRM = has('--confirm'), OWNED = has('--allow-owned'), ADMIN = has('--allow-admin');

(async () => {
  if (!emails.length) { console.error('Usage: node scripts/delete-users.js <email> [<email>...] [--confirm] [--allow-owned] [--allow-admin]'); process.exit(1); }
  const prisma = new PrismaClient();
  try {
    let admins = await prisma.user.count({ where: { role: 'admin' } });
    for (const email of emails) {
      const u = await prisma.user.findUnique({
        where: { email },
        include: { Business: { select: { name: true } }, _count: { select: { Review: true, Booking: true, chatSessions: true } } },
      });
      if (!u) { console.log(`NOT FOUND ${email}`); continue; }
      const info = `${u.email} (${u.name}; role ${u.role}; listings ${u.Business.length}, reviews ${u._count.Review}, bookings ${u._count.Booking}, chats ${u._count.chatSessions})`;
      if (u.role === 'admin' && !ADMIN) { console.log(`SKIP ${info} — admin (use --allow-admin)`); continue; }
      if (u.role === 'admin' && admins <= 1) { console.log(`SKIP ${info} — last admin`); continue; }
      if (u.Business.length && !OWNED) { console.log(`SKIP ${info} — owns listings: ${u.Business.map((b) => b.name).join(', ')} (use --allow-owned to delete them too)`); continue; }
      if (!CONFIRM) { console.log(`would delete ${info}${u.Business.length ? ' + listings: ' + u.Business.map((b) => b.name).join(', ') : ''}`); continue; }
      await prisma.user.delete({ where: { id: u.id } });
      if (u.role === 'admin') admins--;
      console.log(`deleted ${info}`);
    }
    if (!CONFIRM) console.log('\nDry run. Re-run with --confirm to delete.');
  } finally { await prisma.$disconnect(); }
})().catch((e) => { console.error(e.message); process.exit(1); });
