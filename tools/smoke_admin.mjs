// E2E smoke: embedded PG + real API :8110 + built Next admin :8111, driven by Playwright.
import { startTestDb } from './testdb.mjs';
import { createPool, migrate } from '@mtl/db';
import { createApp } from '../services/api/src/app.mjs';
import { spawn } from 'node:child_process';

process.env.ADMIN_EMAILS = 'deon@trgtechlink.com';
const db = await startTestDb();
const pool = createPool(db.url); await migrate(pool);
const links = [];
const server = createApp({ pool, authMax: 1000, sendEmail: async (email, token) => links.push(token) });
await new Promise(r => server.listen(8110, r));

// seed: a member with car+post, a report, a pending packet
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
const s = await login('owner@example.com');
const car = (await api('POST', '/v1/cars', { token: s, body: { handle: 'smoketest', nickname: 'Smoke', model: 'Model Y', model_year: 2024 } })).car;
const post = (await api('POST', '/v1/posts', { token: s, body: { car_id: car.id, kind: 'milestone', title: 'Delivery Day', body: 'first day' } })).post;
await api('POST', '/v1/reports', { token: s, body: { subject_kind: 'post', subject_id: post.id, reason: 'test flag' } });
await pool.query(`INSERT INTO approval_packets(agent,kind,title,payload) VALUES ('community_scout','external_post','Draft reply for r/TeslaLounge','{"draft":"Helpful, no-pitch answer..."}')`);
const adminSession = await login('deon@trgtechlink.com');

// start built admin
const admin = spawn('node', ['apps/admin/.next/standalone/repos/myteslalife/apps/admin/server.js'], {
  env: { ...process.env, PORT: '8111', HOSTNAME: '127.0.0.1' }, stdio: 'inherit' });
await new Promise(r => setTimeout(r, 2500));

const { chromium } = await import('playwright-core');
const browser = await chromium.launch({ executablePath: process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:8111/login');
await page.evaluate(sess => localStorage.setItem('mtl_admin_session', sess), adminSession);

const shots = [['/', 'dash'], ['/moderation', 'mod'], ['/members', 'members'], ['/packets', 'packets']];
for (const [path, name] of shots) {
  await page.goto('http://127.0.0.1:8111' + path);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/work/temp/admin_${name}.png` });
}
// functional check: approve the packet via UI
await page.goto('http://127.0.0.1:8111/packets');
await page.waitForTimeout(1000);
await page.getByText('Approve', { exact: true }).click();
await page.waitForTimeout(800);
const decided = (await pool.query(`SELECT status, decided_by FROM approval_packets`)).rows[0];
console.log('PACKET_AFTER_UI:', JSON.stringify(decided));
// moderation: remove+resolve via UI
await page.goto('http://127.0.0.1:8111/moderation');
await page.waitForTimeout(1000);
await page.getByText('Remove + resolve').click();
await page.waitForTimeout(800);
const rep = (await pool.query(`SELECT status FROM reports`)).rows[0];
const pst = (await pool.query(`SELECT status FROM posts`)).rows[0];
console.log('REPORT_AFTER_UI:', rep.status, 'POST_AFTER_UI:', pst.status);

await browser.close(); admin.kill(); server.close(); await pool.end(); await db.stop();
console.log('SMOKE_DONE');
process.exit(0);
