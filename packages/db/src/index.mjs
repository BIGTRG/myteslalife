import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL not set');
  return new pg.Pool({ connectionString, max: 10 });
}

export async function migrate(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const { rowCount } = await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [f]);
    if (rowCount) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, f), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [f]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error(`migration ${f} failed: ${e.message}`);
    } finally {
      client.release();
    }
  }
}

export async function audit(pool, actor, action, subject, detail = {}) {
  await pool.query(
    'INSERT INTO audit_log(actor, action, subject, detail) VALUES ($1,$2,$3,$4)',
    [actor, action, subject, JSON.stringify(detail)]);
}

export async function track(pool, name, memberId, props = {}) {
  await pool.query(
    'INSERT INTO tracking_events(name, member_id, props) VALUES ($1,$2,$3)',
    [name, memberId, JSON.stringify(props)]);
}
