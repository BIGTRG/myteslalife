// E2E smoke for the Expo web build: embedded PG + API :8110 + dist server :8112 + Playwright phone viewport.
import { startTestDb } from './testdb.mjs';
import { createPool, migrate } from '@mtl/db';
import { createApp } from '../services/api/src/app.mjs';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const db = await startTestDb();
const pool = createPool(db.url); await migrate(pool);
const links = [];
const server = createApp({ pool, authMax: 1000, sendEmail: async (e, t) => links.push(t) });
await new Promise(r => server.listen(8110, r));

const api = async (m, p, { body, token } = {}) => {
  const res = await fetch('http://127.0.0.1:8110' + p, { method: m,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  return res.json().catch(() => null);
};
const login = async (email) => {
  await api('POST', '/v1/auth/magic-link', { body: { email } });
  return (await api('POST', '/v1/auth/redeem', { body: { token: links.pop() } })).session;
};
// seed: Deon with Red October + posts; a second car to follow; products
const s = await login('deon@example.com');
await api('PATCH', '/v1/me', { token: s, body: { first_name: 'Deon' } });
const car = (await api('POST', '/v1/cars', { token: s, body: { handle: 'redoctober', nickname: 'Red October', model: 'Model Y', model_year: 2024, miles: 61204 } })).car;
await api('POST', '/v1/posts', { token: s, body: { car_id: car.id, kind: 'milestone', title: 'Delivery Day', body: 'March 2024 — the story begins' } });
await api('POST', '/v1/posts', { token: s, body: { car_id: car.id, kind: 'milestone', title: 'Crossed 60,000 miles', body: 'Rocky Mountains · last week' } });
const s2 = await login('mid@example.com');
const car2 = (await api('POST', '/v1/cars', { token: s2, body: { handle: 'midnight', nickname: 'Midnight', model: 'Model S Plaid', model_year: 2023 } })).car;
await api('POST', '/v1/posts', { token: s2, body: { car_id: car2.id, kind: 'milestone', title: 'Crossed 100,000 miles today', body: 'Original battery, 91% health. We ride at dawn.' } });
await api('POST', `/v1/cars/${car2.id}/follow`, { token: s });
await pool.query(`INSERT INTO products(name, rating, fitment_note, affiliate_url, price_cents) VALUES
  ('All-Weather Floor Mats',4.8,'1.2K owner reviews','https://partner.example.com/mats',12900),
  ('Roof Rack System',4.7,'fits 2021+ Model S','https://partner.example.com/rack',38900),
  ('Ambient Light Kit',4.6,'installed in 40 min','https://partner.example.com/light',7900)`);

// static dist server
const distDir = 'apps/mobile/dist';
const web = createServer((req, res) => {
  let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
  const f = join(distDir, p);
  if (existsSync(f)) {
    res.setHeader('content-type', p.endsWith('.js') ? 'text/javascript' : p.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    res.end(readFileSync(f));
  } else { res.statusCode = 404; res.end('nf'); }
});
await new Promise(r => web.listen(8112, r));

const { chromium } = await import('playwright-core');
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));

// signin screen first (unauthenticated)
await page.goto('http://localhost:8112/');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/work/temp/mob_signin.png' });
// real magic-link flow through the UI
await page.getByPlaceholder('you@email.com').fill('deon@example.com');
await page.getByText('Email me a magic link').click();
await page.waitForTimeout(600);
const tok = links.pop();
await page.getByPlaceholder('paste code').fill(tok);
await page.getByText('Sign in', { exact: true }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: '/work/temp/mob_garage.png' });
console.log('SIGNIN_OK');

const shot = async (name) => { await page.waitForTimeout(1200); await page.screenshot({ path: `/work/temp/mob_${name}.png` }); };
// tabs by position: controls, carsoul, wheel, feed, shop
const tabs = page.locator('div[style*="border-top"], div');
await page.getByText('🎛').click(); await shot('controls');
await page.getByText('💬', { exact: true }).first().click(); await shot('carsoul');
await page.getByText('🗺').click(); await shot('feed');
await page.getByText('🛒').click(); await shot('market');
// feed → tap post → car profile
await page.getByText('🗺').click(); await page.waitForTimeout(900);
await page.getByText('@midnight').first().click(); await shot('profile');
console.log('NAV_OK');
await browser.close(); web.close(); server.close(); await pool.end(); await db.stop();
console.log('SMOKE_DONE');
process.exit(0);
