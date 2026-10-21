#!/usr/bin/env node
// scripts/smoke-test.js -- end-to-end check of the API, including everything added for
// security: password rules, lockout, email verification, session revocation and the audit log.
//
//   npm run smoke-test                         basic checks (needs the API running)
//   npm run smoke-test -- --lockout            also tests the 5-failed-logins lockout (~1 minute extra)
//   npm run smoke-test -- --uploads            also uploads a test image (leaves one tiny file in uploads/)
//
// To also check the admin audit log, give it an ADMIN account (PowerShell shown):
//   $env:ADMIN_EMAIL="admin@example.com"; $env:ADMIN_PASSWORD="..."; npm run smoke-test
//
// Settings (environment variables):
//   API_URL             default http://localhost:3001
//   THROTTLE_WINDOW_MS  the API's rate-limit window, default 60000 (only change if you changed it)
//
// It creates throw-away accounts named smoke-<time>@example.test and talks to the REAL database
// behind the API, so by default it refuses to run against anything but localhost.
// Add --allow-remote only if you really mean to test a deployed server.
// Exit code: 0 = everything passed, 1 = at least one check failed.

const BASE = (process.env.API_URL || 'http://localhost:3001').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const WINDOW_MS = Number(process.env.THROTTLE_WINDOW_MS || 60000);
const WITH_LOCKOUT = process.argv.includes('--lockout');
const WITH_UPLOADS = process.argv.includes('--uploads');
const ALLOW_REMOTE = process.argv.includes('--allow-remote');

const STARTED = Date.now();
const PASSWORD = 'Smoke-Test-1234'; // satisfies the password rules
let passed = 0;
let failed = 0;
let leftoverAccounts = false;

// ---------------------------------------------------------------- output helpers
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function section(title) {
  console.log(`\n${title}`);
}
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ${green('PASS')}  ${name}`);
  } else {
    failed++;
    console.log(`  ${red('FAIL')}  ${name}${detail ? `\n        ${dim(detail)}` : ''}`);
  }
}
function note(message) {
  console.log(`  ${dim('....  ' + message)}`);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- HTTP helpers
function cookieFrom(res) {
  const all = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : [res.headers.get('set-cookie')].filter(Boolean);
  const line = all.find((c) => c.startsWith('accessToken='));
  return { raw: line || '', pair: line ? line.split(';')[0] : '' };
}

async function call(method, path, { body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* empty or non-JSON body */ }
  const setCookie = cookieFrom(res);
  return { status: res.status, json, headers: res.headers, cookie: setCookie.pair, rawCookie: setCookie.raw };
}

// The API allows only 5 register and 5 login calls per minute per IP. Remember when we made
// ours and wait if the next one would be over the limit, so the test never trips the limiter.
const recent = { register: [], login: [] };
async function paced(kind, fn) {
  const limit = 5;
  for (;;) {
    const now = Date.now();
    recent[kind] = recent[kind].filter((t) => now - t < WINDOW_MS);
    if (recent[kind].length < limit) break;
    const waitMs = recent[kind][0] + WINDOW_MS - now + 500;
    note(`waiting ${Math.ceil(waitMs / 1000)}s to stay under the ${kind} rate limit`);
    await sleep(waitMs);
  }
  recent[kind].push(Date.now());
  const res = await fn();
  // Someone else (your browser, a previous run) may have used up the limit. Wait once and retry.
  if (res.status === 429 && !String(res.json?.message || '').includes('failed attempts')) {
    note('rate limited by the API; waiting for the window to pass, then retrying');
    await sleep(WINDOW_MS + 1000);
    recent[kind] = [Date.now()];
    return fn();
  }
  return res;
}

// A real 24x24 PNG, for the upload checks.
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAH0lEQVR42mM4ISdHFcQwatCoQaMGjRo0atCoQQNvEADGtUkfLD52BgAAAABJRU5ErkJggg==', 'base64');
async function uploadFile(cookie, bytes, filename, type) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), filename);
  const res = await fetch(`${BASE}/uploads`, { method: 'POST', headers: cookie ? { Cookie: cookie } : {}, body: form });
  let json = null;
  try { json = await res.json(); } catch { /* empty or non-JSON body */ }
  return { status: res.status, json };
}

const register = (email, password, name = 'Smoke Test') =>
  paced('register', () => call('POST', '/auth/register', { body: { name, email, password } }));
const login = (email, password) =>
  paced('login', () => call('POST', '/auth/login', { body: { email, password } }));

const ok2xx = (status) => status >= 200 && status < 300;
const newEmail = (tag) => `smoke-${tag}-${Date.now()}@example.test`;

// ---------------------------------------------------------------- the checks
async function basics() {
  section('1. The API is up and sends safe headers');
  const health = await call('GET', '/health');
  check('GET /health answers ok', health.status === 200 && health.json?.status === 'ok', `status ${health.status}`);
  const csp = health.headers.get('content-security-policy') || '';
  check('API sends a locked-down Content-Security-Policy', csp.includes("default-src 'none'") && csp.includes("frame-ancestors 'none'"), `got: ${csp || '(none)'}`);
  check('API sends X-Content-Type-Options: nosniff', health.headers.get('x-content-type-options') === 'nosniff');

  section('2. Public data');
  for (const path of ['/categories', '/hero-images', '/businesses']) {
    const res = await call('GET', path);
    const list = Array.isArray(res.json) ? res.json : res.json?.items;
    check(`GET ${path} returns a list`, res.status === 200 && Array.isArray(list), `status ${res.status}`);
  }
  const anonymousUpload = await call('POST', '/hero-images', { body: { url: 'https://example.com/x.png' } });
  check('Anonymous visitors cannot add hero images', anonymousUpload.status === 401, `status ${anonymousUpload.status}`);
}

async function passwordRules() {
  section('3. Password rules (sign-up)');
  const cases = [
    ['that is too short ("Ab1")', 'Ab1'],
    ['with no uppercase letter', 'alllowercase123'],
    ['with no number', 'NoNumbersHere'],
  ];
  for (const [label, password] of cases) {
    const res = await register(newEmail('weak'), password);
    check(`Rejects a password ${label}`, res.status === 400, `status ${res.status}`);
  }
}

// Returns { email, session } for the later sections.
async function accountLifecycle() {
  section('4. Sign-up and sign-in');
  const email = newEmail('user');
  const created = await register(email, PASSWORD);
  check('Registers a new account', ok2xx(created.status), `status ${created.status} ${JSON.stringify(created.json)}`);
  check('Response never contains a password hash', !JSON.stringify(created.json || {}).toLowerCase().includes('hash'));
  const verificationRequired = created.json?.verificationRequired === true;
  note(`email verification is ${verificationRequired ? 'ON' : 'OFF'} on this API`);
  if (!ok2xx(created.status)) return { email, verificationRequired };

  const duplicate = await register(email, PASSWORD);
  check('Rejects the same email twice', duplicate.status === 409, `status ${duplicate.status}`);

  const wrong = await login(email, 'Wrong-Password-1');
  check('Wrong password is rejected (401)', wrong.status === 401, `status ${wrong.status}`);
  const unknown = await login(newEmail('nobody'), 'Wrong-Password-1');
  check('Unknown email gets the same answer, so emails cannot be discovered',
    unknown.status === 401 && unknown.json?.message === wrong.json?.message,
    `known: ${wrong.json?.message} | unknown: ${unknown.json?.message}`);

  if (verificationRequired) {
    leftoverAccounts = true;
    const blocked = await login(email, PASSWORD);
    check('Right password is refused until the email is confirmed (403 EMAIL_NOT_VERIFIED)',
      blocked.status === 403 && blocked.json?.code === 'EMAIL_NOT_VERIFIED', `status ${blocked.status} ${JSON.stringify(blocked.json)}`);
    const resend = await call('POST', '/auth/resend-verification', { body: { email } });
    const resendUnknown = await call('POST', '/auth/resend-verification', { body: { email: newEmail('nobody') } });
    check('Resending a confirmation email works', ok2xx(resend.status), `status ${resend.status}`);
    check('Resend answers identically for unknown emails',
      resend.status === resendUnknown.status && resend.json?.message === resendUnknown.json?.message);
    const badToken = await call('POST', '/auth/verify-email', { body: { token: 'not-a-real-token' } });
    check('A made-up confirmation link is rejected (400)', badToken.status === 400, `status ${badToken.status}`);
    note('Open the confirmation email and click the link to finish this flow by hand (see docs/TESTING.md).');
    return { email, verificationRequired };
  }

  const first = await login(email, PASSWORD);
  check('Right password signs in', ok2xx(first.status) && !!first.cookie, `status ${first.status}`);
  check('The session cookie is HttpOnly', /httponly/i.test(first.rawCookie), first.rawCookie);
  check('The session cookie is SameSite', /samesite=(lax|strict)/i.test(first.rawCookie), first.rawCookie);
  if (!first.cookie) return { email, verificationRequired };

  section('5. Sessions and access control');
  const me = await call('GET', '/auth/me', { cookie: first.cookie });
  check('GET /auth/me works with the session', me.status === 200 && me.json?.role === 'user', `status ${me.status} ${JSON.stringify(me.json)}`);
  check('GET /auth/me is refused without a session', (await call('GET', '/auth/me')).status === 401);
  check('A normal user cannot read the audit log (403)', (await call('GET', '/audit-logs', { cookie: first.cookie })).status === 403);
  check('An anonymous visitor cannot read the audit log (401)', (await call('GET', '/audit-logs')).status === 401);

  const logoutAll = await call('POST', '/auth/logout-all', { cookie: first.cookie });
  check('"Log out everywhere" succeeds', ok2xx(logoutAll.status), `status ${logoutAll.status}`);
  const afterRevoke = await call('GET', '/auth/me', { cookie: first.cookie });
  check('The old session stops working after "log out everywhere"', afterRevoke.status === 401, `status ${afterRevoke.status}`);

  const second = await login(email, PASSWORD);
  check('Signing in again gives a working new session',
    ok2xx(second.status) && (await call('GET', '/auth/me', { cookie: second.cookie })).status === 200);

  if (WITH_UPLOADS) {
    section('5b. Image uploads');
    const anonymous = await uploadFile('', TINY_PNG, 'photo.png', 'image/png');
    check('Anonymous visitors cannot upload (401)', anonymous.status === 401, `status ${anonymous.status}`);
    const fake = await uploadFile(second.cookie, Buffer.from('just some text, not an image'), 'evil.png', 'image/png');
    check('A text file renamed to .png is refused (400)', fake.status === 400, `status ${fake.status}`);
    const good = await uploadFile(second.cookie, TINY_PNG, 'photo.png', 'image/png');
    check('A real image uploads', ok2xx(good.status) && !!good.json?.url, `status ${good.status} ${JSON.stringify(good.json)}`);
    check('It is shrunk and stored as WebP', /\.webp$/.test(good.json?.url || ''), good.json?.url || '(no url)');
    const served = good.json?.url ? await fetch(good.json.url) : null;
    check('The stored file is served back as an image',
      !!served && served.status === 200 && (served.headers.get('content-type') || '').startsWith('image/'),
      served ? `status ${served.status} ${served.headers.get('content-type')}` : '(no url)');
    note('This left one tiny file in the uploads folder; it is harmless and can be deleted.');
  }

  const removal = await call('DELETE', '/me/account', { cookie: second.cookie });
  check('The account can be deleted', ok2xx(removal.status), `status ${removal.status}`);
  const afterDelete = await login(email, PASSWORD);
  check('A deleted account can no longer sign in', afterDelete.status === 401, `status ${afterDelete.status}`);
  return { email, verificationRequired, completed: true };
}

async function lockout() {
  section('6. Lockout after repeated wrong passwords');
  const email = newEmail('lock');
  const created = await register(email, PASSWORD);
  if (!ok2xx(created.status)) {
    check('Creates the account used for the lockout test', false, `status ${created.status}`);
    return;
  }
  leftoverAccounts = true;
  for (let i = 1; i <= 5; i++) await login(email, `Wrong-Password-${i}`);
  note('5 wrong passwords sent. Waiting for the rate-limit window so the lockout itself is what answers...');
  await sleep(WINDOW_MS + 1000);
  recent.login = [];
  const locked = await login(email, PASSWORD);
  check('Even the RIGHT password is refused while the account is locked (429, "failed attempts")',
    locked.status === 429 && String(locked.json?.message || '').includes('failed attempts'),
    `status ${locked.status} ${JSON.stringify(locked.json)}`);
  note('The test account stays locked for 15 minutes; see the cleanup SQL at the end.');
}

async function adminAndAuditLog(flow, expectLockout) {
  section(`${WITH_LOCKOUT ? '7' : '6'}. Admin audit log`);
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    note('skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to test the audit log (see the top of this file)');
    return;
  }
  const admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  check('Admin can sign in', ok2xx(admin.status) && !!admin.cookie, `status ${admin.status}`);
  if (!admin.cookie) return;
  const me = await call('GET', '/auth/me', { cookie: admin.cookie });
  check('The account really is an admin', me.json?.role === 'admin', JSON.stringify(me.json));

  const logs = await call('GET', '/audit-logs?limit=100', { cookie: admin.cookie });
  check('GET /audit-logs works for an admin', logs.status === 200 && Array.isArray(logs.json?.items), `status ${logs.status}`);
  if (!Array.isArray(logs.json?.items)) return;
  check('The response is paged (total, page, limit)',
    typeof logs.json.total === 'number' && logs.json.page === 1 && typeof logs.json.limit === 'number');

  const mine = logs.json.items.filter((item) => new Date(item.createdAt).getTime() >= STARTED - 2000);
  const seen = new Set(mine.map((item) => item.action));
  note(`events recorded during this run: ${[...seen].sort().join(', ') || '(none)'}`);
  // What we expect depends on what THIS run actually did, not on what happens to be in the log
  // (the admin login above also writes an auth.login_success entry).
  const expected = ['auth.register', 'auth.login_failed'];
  if (flow.verificationRequired) expected.push('auth.verification_sent', 'auth.login_unverified');
  else if (flow.completed) expected.push('auth.login_success', 'auth.logout_all', 'account.deleted');
  if (expectLockout) expected.push('auth.account_locked');
  for (const action of expected) {
    check(`The audit log recorded "${action}"`, seen.has(action));
  }
  const failedLogin = mine.find((item) => item.action === 'auth.login_failed');
  check('Entries record where the request came from (IP address)', !failedLogin || !!failedLogin.ip);

  const filtered = await call('GET', '/audit-logs?action=auth&limit=100', { cookie: admin.cookie });
  check('Filtering by "auth" returns only auth events',
    filtered.status === 200 && filtered.json.items.length > 0 && filtered.json.items.every((i) => i.action.startsWith('auth')));
}

// ---------------------------------------------------------------- run
(async () => {
  const host = new URL(BASE).hostname;
  if (!ALLOW_REMOTE && !['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
    console.error(`Refusing to run against ${BASE}: this test creates accounts in the real database behind it.\nAdd --allow-remote if you really mean it.`);
    process.exit(1);
  }
  console.log(`Smoke test against ${BASE}`);
  try {
    await basics();
  } catch (error) {
    console.error(red(`\nCould not reach the API at ${BASE}: ${error.message}`));
    console.error('Is the backend running? (cd backend, npm run start:dev)');
    process.exit(1);
  }
  await passwordRules();
  const flow = await accountLifecycle();
  if (WITH_LOCKOUT) await lockout();
  await adminAndAuditLog(flow, WITH_LOCKOUT);

  console.log(`\n${failed === 0 ? green('ALL CHECKS PASSED') : red(`${failed} CHECK(S) FAILED`)}  (${passed} passed, ${failed} failed)`);
  if (leftoverAccounts) {
    console.log(`\nThis run left test accounts behind. Remove them with:\n  DELETE FROM "User" WHERE email LIKE 'smoke-%@example.test';`);
  }
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(red(`Unexpected error: ${error.stack || error.message}`));
  process.exit(1);
});
