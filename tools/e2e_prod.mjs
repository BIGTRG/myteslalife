// E2E against the DEPLOYED myteslalife stack (run from a machine with fleet SSH).
// Journey: magic-link email actually arrives (Genius Eye Mail) -> redeem -> car -> post ->
// feed -> public profile -> affiliate redirect -> report -> admin moderation + metrics.
// Usage: node tools/e2e_prod.mjs   (needs ~/.ssh/id_ed25519 authorized on fleet #1)
import { execSync } from 'node:child_process';

const API = 'https://api.myteslalife.com';
const TEST_EMAIL = 'mtltest@geniuseye.ai';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
};
const api = async (m, p, { body, token } = {}) => {
  const res = await fetch(API + p, {
    method: m, redirect: 'manual',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
};

// 0. clear the test mailbox so we only ever read the fresh token
try { execSync(`ssh -o BatchMode=yes root@178.105.21.227 "ssh -o BatchMode=yes -i /root/.ssh/id_rsa root@178.104.209.97 'cat /dev/null > /var/mail/mtltest'"`); } catch {}

// 1. request magic link -> real email over SMTP
const ml = await api('POST', '/v1/auth/magic-link', { body: { email: TEST_EMAIL } });
ok('magic-link accepted', ml.status === 200, JSON.stringify(ml.data));

// 2. read the mailbox on the mail server (mbox), extract newest token
let token = null;
for (let i = 0; i < 12 && !token; i++) {
  await new Promise(r => setTimeout(r, 5000));
  try {
    const mbox = execSync(
      `ssh -o BatchMode=yes root@178.105.21.227 "ssh -o BatchMode=yes -i /root/.ssh/id_rsa root@178.104.209.97 'tail -c 20000 /var/mail/mtltest 2>/dev/null'"`,
      { encoding: 'utf8' });
    const m = [...mbox.matchAll(/auth\?token=(?:3D)?([A-Za-z0-9_-]+)/g)];
    if (m.length) token = m[m.length - 1][1];
  } catch {}
}
ok('magic-link email ARRIVED in real mailbox', !!token);

// 3. redeem
const rd = await api('POST', '/v1/auth/redeem', { body: { token } });
ok('redeem -> session', rd.status === 200 && !!rd.data?.session);
const s = rd.data?.session;
const rd2 = await api('POST', '/v1/auth/redeem', { body: { token } });
ok('token is single-use', rd2.status !== 200);

// 4. profile + car + post
await api('PATCH', '/v1/me', { token: s, body: { first_name: 'E2E' } });
const me = await api('GET', '/v1/me', { token: s });
ok('GET /v1/me', me.status === 200 && me.data?.member?.email === TEST_EMAIL);
const handle = 'e2e' + Date.now().toString(36);
const car = await api('POST', '/v1/cars', { token: s, body: { handle, nickname: 'E2E Car', model: 'Model 3', model_year: 2024 } });
ok('create car', car.status === 200 || car.status === 201, JSON.stringify(car.data));
const carId = car.data?.car?.id;
const post = await api('POST', '/v1/posts', { token: s, body: { car_id: carId, kind: 'milestone', title: 'E2E launch check', body: 'automated' } });
ok('create post', post.status === 200 || post.status === 201);
const postId = post.data?.post?.id;

// 5. feed + public car profile
const feed = await api('GET', '/v1/feed', { token: s });
ok('feed shows post', feed.status === 200 && JSON.stringify(feed.data).includes('E2E launch check'));
const pub = await api('GET', `/v1/cars/@${handle}`);
ok('public car profile', pub.status === 200 && JSON.stringify(pub.data).includes(handle));

// 6. affiliate redirect endpoint responds (404 ok if no products seeded)
const go = await fetch(API + '/v1/products/00000000-0000-0000-0000-000000000000/go', { redirect: 'manual' });
ok('/go endpoint alive', [302, 404].includes(go.status), String(go.status));

// 7. moderation: report own post, admin resolves
const rep = await api('POST', '/v1/reports', { token: s, body: { subject_kind: 'post', subject_id: postId, reason: 'e2e-test' } });
ok('report post', rep.status === 200 || rep.status === 201);
const q = await api('GET', '/v1/admin/moderation', { token: s });
ok('admin moderation queue', q.status === 200 && JSON.stringify(q.data).includes(postId ?? 'x'));
const reportId = (q.data?.open_reports ?? []).find(r => r.subject_id === postId)?.id;
const res1 = await api('POST', `/v1/admin/reports/${reportId}/resolve`, { token: s, body: { outcome: 'dismissed' } });
ok('admin resolve report', res1.status === 200);

// 8. admin metrics
const met = await api('GET', '/v1/admin/metrics', { token: s });
ok('admin metrics', met.status === 200 && met.data != null);

// 9. legal pages + web + admin over HTTPS
for (const [n, u, needle] of [
  ['web app live', 'https://myteslalife.com/', 'myteslalife'],
  ['terms live', 'https://myteslalife.com/legal/terms', 'Terms'],
  ['privacy live', 'https://myteslalife.com/legal/privacy', 'Privacy'],
  ['admin live', 'https://admin.myteslalife.com/login', 'html'],
]) {
  const r = await fetch(u); const t = await r.text();
  ok(n, r.status === 200 && t.toLowerCase().includes(needle.toLowerCase()));
}

// 10. cleanup: delete test account (also exercises in-app deletion requirement)
const del = await api('DELETE', '/v1/me', { token: s });
ok('DELETE /v1/me (account deletion)', del.status === 200);
const after = await api('GET', '/v1/me', { token: s });
ok('session dead after deletion', after.status === 401);

console.log(`\nRESULT ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
