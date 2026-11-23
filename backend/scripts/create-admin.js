#!/usr/bin/env node
// scripts/create-admin.js -- create an admin account, or reset the password of an existing one.
// Plain JS on purpose, so it runs in production without ts-node. It is run by create-admin.sh
// inside the backend container; you normally do not call it yourself.
//
// It reads THREE LINES from standard input: email, name, password. The password is never a
// command-line argument (those show up in process lists) and is never printed or logged.
//
// If the email already exists: the password is replaced, the role becomes "admin", the account
// is unlocked and unbanned, and every old login of that account is signed out.
// If it does not exist: a new admin account is created.
try { require('dotenv/config'); } catch { /* env already set by the host */ }
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const BCRYPT_ROUNDS = 12; // same cost as auth.service.ts
const PASSWORD_OK = /^(?=.*[A-Z])(?=.*[0-9]).+$/;

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

(async () => {
  const [emailRaw, nameRaw, password] = (await readStdin()).split('\n').map((l) => l.replace(/\r$/, ''));
  const email = (emailRaw || '').trim();
  const name = (nameRaw || '').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) { console.error('That is not a valid email address.'); process.exit(1); }
  if (!password || password.length < 8 || password.length > 72 || !PASSWORD_OK.test(password)) {
    console.error('The password needs 8 to 72 characters, with an uppercase letter and a number.'); process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const existing = await prisma.user.findUnique({ where: { email } });
    let user; let action;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash, role: 'admin', emailVerified: true, isBanned: false,
          failedLogins: 0, lockedUntil: null, resetToken: null, resetExpires: null,
          tokenVersion: { increment: 1 }, // signs this account out everywhere
        },
        select: { id: true },
      });
      action = 'reset';
    } else {
      user = await prisma.user.create({
        data: { name: name || 'Admin', email, passwordHash, role: 'admin', emailVerified: true },
        select: { id: true },
      });
      action = 'created';
    }
    // Traceable in Admin -> Audit log. Never blocks the result, and never holds the password.
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'admin.' + action + '-by-script', targetType: 'user', targetId: user.id, metadata: { via: 'create-admin.sh' } },
    }).catch(() => {});
    console.log(action === 'created' ? 'Admin account created: ' + email : 'Password reset and admin role confirmed for: ' + email);
  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
