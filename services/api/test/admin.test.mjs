import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestDb } from '../../../tools/testdb.mjs';
import { createPool, migrate } from '@mtl/db';
import { createApp } from '../src/app.mjs';

let db, pool, server, base;
const sent = [];
process.env.ADMIN_EMAILS = 'deon@trgtechlink.com';

const api = async (method, path, { body, token } = {}) => {
  const res = await fetch(base + path, { method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, data: await res.json().catch(() => null) };
};
async function signup(email) {
  await api('POST', '/v1/auth/magic-link', { body: { email } });
  const r = await api('POST', '/v1/auth/redeem', { body: { token: sent.pop().token } });
  return r.data.session;
}

before(async () => {
  db = await startTestDb(); pool = createPool(db.url); await migrate(pool);
  server = createApp({ pool, authMax: 1000, sendEmail: async (email, token) => sent.push({ email, token }) });
  await new Promise(r => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.close(); await pool.end(); await db.stop(); });

test('non-admin gets 403 on admin routes', async () => {
  const s = await signup('member@example.com');
  assert.equal((await api('GET', '/v1/admin/metrics', { token: s })).status, 403);
});

test('moderation flow: report → queue → hide post → resolve', async () => {
  const member = await signup('poster@example.com');
  const adminS = await signup('deon@trgtechlink.com');
  const car = (await api('POST', '/v1/cars', { token: member, body: {
    handle: 'modcar', nickname: 'Mod', model: 'Model 3', model_year: 2023 } })).data.car;
  const post = (await api('POST', '/v1/posts', { token: member, body: {
    car_id: car.id, kind: 'photo', title: 'spammy thing' } })).data.post;

  assert.equal((await api('POST', '/v1/reports', { token: member, body: {
    subject_kind: 'post', subject_id: post.id, reason: 'spam' } })).status, 201);

  const q = await api('GET', '/v1/admin/moderation', { token: adminS });
  assert.equal(q.status, 200);
  assert.equal(q.data.open_reports.length, 1);

  assert.equal((await api('POST', `/v1/admin/posts/${post.id}/status`, { token: adminS, body: { status: 'removed' } })).status, 200);
  assert.equal((await api('POST', `/v1/admin/reports/${q.data.open_reports[0].id}/resolve`, { token: adminS, body: { outcome: 'actioned' } })).status, 200);

  // removed post no longer in feed
  const feed = await api('GET', '/v1/feed', { token: member });
  assert.ok(!feed.data.posts.some(p => p.id === post.id));
});

test('metrics include weekly active cars + funnel', async () => {
  const adminS = await signup('deon@trgtechlink.com');
  const m = await api('GET', '/v1/admin/metrics', { token: adminS });
  assert.equal(m.status, 200);
  assert.ok(m.data.members >= 2);
  assert.ok(m.data.weekly_active_cars >= 1);
  assert.ok(Array.isArray(m.data.funnel_7d));
});

test('member lookup searches by email', async () => {
  const adminS = await signup('deon@trgtechlink.com');
  const r = await api('GET', '/v1/admin/members?q=poster', { token: adminS });
  assert.equal(r.data.members.length, 1);
  assert.equal(r.data.members[0].cars, 1);
});

test('T2 approval packets: pending → decide once', async () => {
  const adminS = await signup('deon@trgtechlink.com');
  const { rows: [pkt] } = await pool.query(
    `INSERT INTO approval_packets(agent, kind, title, payload)
     VALUES ('community_scout','external_post','Reply to r/TeslaLounge battery thread','{"draft":"..."}') RETURNING id`);
  const list = await api('GET', '/v1/admin/packets', { token: adminS });
  assert.equal(list.data.packets.length, 1);
  assert.equal((await api('POST', `/v1/admin/packets/${pkt.id}/decide`, { token: adminS, body: { decision: 'approved', note: 'good, helpful' } })).status, 200);
  assert.equal((await api('POST', `/v1/admin/packets/${pkt.id}/decide`, { token: adminS, body: { decision: 'rejected' } })).status, 409);
});
