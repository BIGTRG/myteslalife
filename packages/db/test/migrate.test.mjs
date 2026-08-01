import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestDb } from '../../../tools/testdb.mjs';
import { createPool, migrate, audit, track } from '@mtl/db';

let db, pool;
before(async () => { db = await startTestDb(); pool = createPool(db.url); await migrate(pool); });
after(async () => { await pool.end(); await db.stop(); });

test('migrations are idempotent', async () => { await migrate(pool); });

test('all core tables exist', async () => {
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  const names = rows.map(r => r.table_name);
  for (const t of ['members','cars','posts','follows','clubs','club_memberships','events','event_rsvps',
    'products','mod_list_items','qa_threads','notifications','audit_log','tracking_events','waitlist',
    'magic_links','sessions','post_likes','post_replies'])
    assert.ok(names.includes(t), `missing table ${t}`);
});

test('audit + track helpers write rows', async () => {
  await audit(pool, 'agent:test', 'unit_test', 'subject', { a: 1 });
  await track(pool, 'member_registered', null, { src: 'test' });
  assert.equal((await pool.query(`SELECT count(*)::int c FROM audit_log`)).rows[0].c >= 1, true);
});

test('tracking_events rejects unknown event names', async () => {
  await assert.rejects(track(pool, 'bogus_event', null, {}));
});
