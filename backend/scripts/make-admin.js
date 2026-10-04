#!/usr/bin/env node
// scripts/make-admin.js — one-off: set a user's role (use it to create the FIRST admin).
// Plain JS on purpose, so it runs in production without ts-node.
//
//   node scripts/make-admin.js you@example.com            -> role "admin"
//   node scripts/make-admin.js you@example.com --role=user -> demote back
//
// The user must already exist (register through the site first). Reads
// DATABASE_URL from the environment / .env.
try { require('dotenv/config'); } catch { /* env already set by the host */ }
const { PrismaClient } = require('@prisma/client');

const email = process.argv[2];
const role = (process.argv.find((a) => a.startsWith('--role=')) || '--role=admin').split('=')[1];

(async () => {
  if (!email || email.startsWith('--')) { console.error('Usage: node scripts/make-admin.js <email> [--role=admin|user]'); process.exit(1); }
  if (!['admin', 'user'].includes(role)) { console.error('--role must be "admin" or "user"'); process.exit(1); }
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.error(`No user with email ${email}. Register that account first.`); process.exit(1); }
    await prisma.user.update({ where: { id: user.id }, data: { role } });
    console.log(`${email}: role ${user.role} -> ${role}`);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
