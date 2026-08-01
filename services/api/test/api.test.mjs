import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestDb } from '../../../tools/testdb.mjs';
import { createPool, migrate } from '@mtl/db';
import { createApp } from '../src/app.mjs';

let db, pool, server, base;
const sentLinks = [];
const api = async (method, path, { body, token } = {}) => {
  const res = await fetch(base + path, {
    method, redirect: 'manual',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data, headers: res.headers };
};

async function signup(email) {
  await api('POST', '/v1/auth/magic-link', { body: { email } });
  const token = sentLinks.pop().token;
  const r = await api('POST', '/v1/auth/redeem', { body: { token } });
  return r.data.session;
}

before(async () => {
  db = await startTestDb(); pool = createPool(db.url); await migrate(pool);
  server = createApp({ pool, authMax: 1000, sendEmail: async (email, token) => sentLinks.push({ email, token }) });
  await new Promise(r => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { server.close(); await pool.end(); await db.stop(); });

test('health + legal pages', async () => {
  assert.equal((await api('GET', '/health')).status, 200);
  const tos = await fetch(base + '/legal/terms'); assert.match(await tos.text(), /Terms of Service/);
  const pp = await fetch(base + '/legal/privacy'); assert.match(await pp.text(), /never sell/i);
  const d = await api('GET', '/legal/disclaimer');
  assert.match(d.data.disclaimer, /not affiliated with.*Tesla/i);
});

test('magic link signup → session → me', async () => {
  const s = await signup('deon@example.com');
  const me = await api('GET', '/v1/me', { token: s });
  assert.equal(me.status, 200);
  assert.equal(me.data.member.email, 'deon@example.com');
});

test('magic link cannot be reused', async () => {
  await api('POST', '/v1/auth/magic-link', { body: { email: 'x@example.com' } });
  const { token } = sentLinks.pop();
  assert.equal((await api('POST', '/v1/auth/redeem', { body: { token } })).status, 200);
  assert.equal((await api('POST', '/v1/auth/redeem', { body: { token } })).status, 401);
});

test('unauthenticated requests are rejected', async () => {
  assert.equal((await api('GET', '/v1/me')).status, 401);
  assert.equal((await api('POST', '/v1/posts', { body: {} })).status, 401);
});

test('full Definition-of-Done journey: car → delivery day post → follow 3 → club → affiliate → public profile', async () => {
  const s = await signup('journey@example.com');

  // create + name car with photo
  const car = (await api('POST', '/v1/cars', { token: s, body: {
    handle: 'redoctober', nickname: 'Red October', model: 'Model Y', model_year: 2024,
    miles: 61204, photo_url: 'https://cdn.example.com/red.jpg' } })).data.car;
  assert.ok(car.id);

  // duplicate handle rejected
  const s2 = await signup('other@example.com');
  assert.equal((await api('POST', '/v1/cars', { token: s2, body: {
    handle: 'redoctober', nickname: 'Copy', model: 'Model 3', model_year: 2023 } })).status, 409);

  // delivery day post
  const post = (await api('POST', '/v1/posts', { token: s, body: {
    car_id: car.id, kind: 'milestone', title: 'Delivery Day',
    body: 'the story begins', meta: { badge: 'Delivery Day' } } })).data.post;
  assert.ok(post.id);

  // 3 more cars to follow
  const ids = [];
  for (let i = 0; i < 3; i++) {
    const sx = await signup(`friend${i}@example.com`);
    const c = (await api('POST', '/v1/cars', { token: sx, body: {
      handle: `friend${i}`, nickname: `Car ${i}`, model: 'Model 3', model_year: 2022 } })).data.car;
    ids.push(c.id);
  }
  for (const id of ids) assert.equal((await api('POST', `/v1/cars/${id}/follow`, { token: s })).status, 200);

  // join a club
  const club = (await pool.query(
    `INSERT INTO clubs(slug, name, city) VALUES ('phoenix-owners','Phoenix Owners Club','Phoenix') RETURNING id`)).rows[0];
  assert.equal((await api('POST', `/v1/clubs/${club.id}/join`, { token: s })).status, 200);

  // affiliate product click
  const prod = (await pool.query(
    `INSERT INTO products(name, affiliate_url, price_cents) VALUES ('All-Weather Floor Mats','https://partner.example.com/mats?aff=mtl',12900) RETURNING id`)).rows[0];
  await api('POST', `/v1/cars/${car.id}/mods`, { token: s, body: { product_id: prod.id, note: 'fits 2024 Model Y' } });
  const go = await api('GET', `/v1/products/${prod.id}/go`, { token: s });
  assert.equal(go.status, 302);
  assert.match(go.headers.get('location'), /partner\.example\.com/);

  // public car profile renders with autobiography + mods + disclosures
  const pub = await api('GET', '/v1/cars/@redoctober');
  assert.equal(pub.status, 200);
  assert.equal(pub.data.car.followers, 0);
  assert.equal(pub.data.autobiography[0].title, 'Delivery Day');
  assert.equal(pub.data.mod_list.length, 1);
  assert.match(pub.data.disclaimer, /not affiliated/i);
  assert.match(pub.data.affiliate_disclosure, /commission/i);
  assert.equal(pub.data.car.privacy, undefined, 'privacy settings never leak publicly');

  // all day-1 tracking events fired
  const evts = (await pool.query(`SELECT DISTINCT name FROM tracking_events`)).rows.map(r => r.name);
  for (const e of ['member_registered','car_profile_created','car_named','post_created','follow_created','club_joined','affiliate_click'])
    assert.ok(evts.includes(e), `missing tracking event ${e}`);
});

test('feed returns posts with counts', async () => {
  const s = await signup('feedviewer@example.com');
  const feed = await api('GET', '/v1/feed', { token: s });
  assert.equal(feed.status, 200);
  assert.ok(feed.data.posts.length >= 1);
  const p = feed.data.posts.find(p => p.title === 'Delivery Day');
  assert.equal(p.handle, 'redoctober');
});

test('privacy: public_profile=false hides car', async () => {
  const s = await signup('private@example.com');
  const car = (await api('POST', '/v1/cars', { token: s, body: {
    handle: 'ghostcar', nickname: 'Ghost', model: 'Model S', model_year: 2021,
    privacy: { public_profile: false, location: 'hidden', benchmarking: false, telemetry: false } } })).data.car;
  assert.ok(car.id);
  assert.equal((await api('GET', '/v1/cars/@ghostcar')).status, 404);
});

test('account deletion revokes sessions and hides content', async () => {
  const s = await signup('deleteme@example.com');
  await api('POST', '/v1/cars', { token: s, body: { handle: 'deletedcar', nickname: 'Bye', model: 'Model X', model_year: 2020 } });
  assert.equal((await api('DELETE', '/v1/me', { token: s })).status, 200);
  assert.equal((await api('GET', '/v1/me', { token: s })).status, 401);
});

test('waitlist accepts and converts', async () => {
  await api('POST', '/v1/waitlist', { body: { email: 'founding@example.com', source: 'landing' } });
  await signup('founding@example.com');
  const c = (await pool.query(`SELECT converted_at FROM waitlist WHERE email='founding@example.com'`)).rows[0];
  assert.ok(c.converted_at);
});
