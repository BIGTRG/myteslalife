import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { audit, track } from '@mtl/db';

const MAGIC_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');

export async function requestMagicLink(pool, email, sendEmail) {
  const token = newToken();
  await pool.query(
    'INSERT INTO magic_links(email, token_hash, expires_at) VALUES ($1,$2,$3)',
    [email, sha256(token), new Date(Date.now() + MAGIC_TTL_MS)]);
  await sendEmail(email, token);
  return { ok: true };
}

export async function redeemMagicLink(pool, token) {
  const { rows } = await pool.query(
    `UPDATE magic_links SET used_at = now()
     WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()
     RETURNING email`, [sha256(token)]);
  if (!rows.length) return null;
  const email = rows[0].email;
  let m = (await pool.query('SELECT * FROM members WHERE email=$1 AND deleted_at IS NULL', [email])).rows[0];
  let isNew = false;
  if (!m) {
    m = (await pool.query('INSERT INTO members(email) VALUES ($1) RETURNING *', [email])).rows[0];
    isNew = true;
    await track(pool, 'member_registered', m.id, {});
    await pool.query('UPDATE waitlist SET converted_at = now() WHERE email=$1 AND converted_at IS NULL', [email]);
    const conv = (await pool.query('SELECT 1 FROM waitlist WHERE email=$1 AND converted_at IS NOT NULL', [email])).rowCount;
    if (conv) await track(pool, 'waitlist_converted', m.id, {});
  }
  const session = newToken();
  await pool.query(
    'INSERT INTO sessions(member_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [m.id, sha256(session), new Date(Date.now() + SESSION_TTL_MS)]);
  await audit(pool, `member:${m.id}`, isNew ? 'signup' : 'login', `member:${m.id}`);
  return { member: m, session, isNew };
}

export async function memberFromSession(pool, token) {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT m.* FROM sessions s JOIN members m ON m.id = s.member_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > now() AND m.deleted_at IS NULL`,
    [sha256(token)]);
  return rows[0] ?? null;
}

export async function revokeSession(pool, token) {
  await pool.query('UPDATE sessions SET revoked_at = now() WHERE token_hash=$1', [sha256(token)]);
}
