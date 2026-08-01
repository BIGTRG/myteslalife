// myteslalife API — custom router on node:http. REST, versioned (/v1), rate-limited.
import { createServer } from 'node:http';
import { audit, track } from '@mtl/db';
import { DISCLAIMER } from '@mtl/tokens';
import { requestMagicLink, redeemMagicLink, memberFromSession, revokeSession } from './auth.mjs';
import { isAdmin, handleAdmin } from './admin.mjs';
import { tosHtml, privacyHtml } from './legal.mjs';

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const html = (res, body) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(body); };

// simple fixed-window rate limiter per ip+route class
function makeLimiter({ windowMs = 60000, max = 120 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref?.();
  return (key) => {
    const n = (hits.get(key) ?? 0) + 1;
    hits.set(key, n);
    return n <= max;
  };
}

export function createApp({ pool, sendEmail = async () => {}, authMax = 10 }) {
  const limit = makeLimiter({ max: 240 });
  const authLimit = makeLimiter({ max: authMax });

  async function readBody(req) {
    let size = 0; const chunks = [];
    for await (const c of req) { size += c.length; if (size > 2_000_000) throw new Error('body too large'); chunks.push(c); }
    if (!chunks.length) return {};
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  const bearer = (req) => (req.headers.authorization ?? '').replace(/^Bearer /, '') || null;

  const server = createServer(async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const url = new URL(req.url, 'http://x');
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const route = `${req.method} ${path}`;
    try {
      if (!limit(ip)) return json(res, 429, { error: 'rate_limited' });

      // ---- public / legal ----
      if (route === 'GET /health') return json(res, 200, { ok: true });
      if (route === 'GET /legal/terms') return html(res, tosHtml());
      if (route === 'GET /legal/privacy') return html(res, privacyHtml());
      if (route === 'GET /legal/disclaimer') return json(res, 200, { disclaimer: DISCLAIMER });

      // ---- auth ----
      if (route === 'POST /v1/auth/magic-link') {
        if (!authLimit(ip)) return json(res, 429, { error: 'rate_limited' });
        const { email } = await readBody(req);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return json(res, 400, { error: 'invalid_email' });
        await requestMagicLink(pool, email.toLowerCase(), sendEmail);
        return json(res, 200, { ok: true }); // never reveal whether the email exists
      }
      if (route === 'POST /v1/auth/redeem') {
        if (!authLimit(ip)) return json(res, 429, { error: 'rate_limited' });
        const { token } = await readBody(req);
        const r = token ? await redeemMagicLink(pool, token) : null;
        if (!r) return json(res, 401, { error: 'invalid_or_expired' });
        return json(res, 200, { session: r.session, is_new: r.isNew,
          member: { id: r.member.id, email: r.member.email, first_name: r.member.first_name } });
      }
      if (route === 'POST /v1/auth/logout') {
        const t = bearer(req);
        if (t) await revokeSession(pool, t);
        return json(res, 200, { ok: true });
      }
      if (route === 'POST /v1/waitlist') {
        const { email, source } = await readBody(req);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return json(res, 400, { error: 'invalid_email' });
        await pool.query('INSERT INTO waitlist(email, source) VALUES ($1,$2) ON CONFLICT (email) DO NOTHING', [email.toLowerCase(), source ?? null]);
        return json(res, 200, { ok: true });
      }

      // ---- public car profile (screen 8) ----
      let m1;
      if (req.method === 'GET' && (m1 = path.match(/^\/v1\/cars\/@([a-z0-9_]+)$/))) {
        const car = (await pool.query(
          `SELECT c.id, c.handle, c.nickname, c.model, c.model_year, c.miles, c.photo_url, c.profile, c.privacy, c.created_at,
                  (SELECT count(*)::int FROM follows f WHERE f.car_id = c.id) AS followers
           FROM cars c WHERE c.handle=$1 AND c.deleted_at IS NULL`, [m1[1]])).rows[0];
        if (!car || car.privacy.public_profile === false) return json(res, 404, { error: 'not_found' });
        const timeline = (await pool.query(
          `SELECT id, kind, title, body, meta, created_at FROM posts
           WHERE car_id=$1 AND status='live' ORDER BY created_at DESC LIMIT 50`, [car.id])).rows;
        const mods = (await pool.query(
          `SELECT p.id, p.name, p.image_url, p.rating, p.price_cents, p.fitment_note, mli.note
           FROM mod_list_items mli JOIN products p ON p.id = mli.product_id
           WHERE mli.car_id=$1 ORDER BY mli.position`, [car.id])).rows;
        delete car.privacy;
        return json(res, 200, { car, autobiography: timeline, mod_list: mods, disclaimer: DISCLAIMER,
          affiliate_disclosure: 'myteslalife earns a commission on marked links.' });
      }

      // ---- affiliate click tracking + redirect (public) ----
      let m2;
      if (req.method === 'GET' && (m2 = path.match(/^\/v1\/products\/([0-9a-f-]{36})\/go$/))) {
        const p = (await pool.query('SELECT affiliate_url FROM products WHERE id=$1', [m2[1]])).rows[0];
        if (!p) return json(res, 404, { error: 'not_found' });
        const viewer = await memberFromSession(pool, bearer(req) ?? url.searchParams.get('s'));
        await track(pool, 'affiliate_click', viewer?.id ?? null, { product_id: m2[1] });
        res.writeHead(302, { location: p.affiliate_url }); return res.end();
      }

      // ---- everything below requires a session ----
      const me = await memberFromSession(pool, bearer(req));
      if (!me) return json(res, 401, { error: 'unauthorized' });

      if (route === 'GET /v1/me') {
        const cars = (await pool.query('SELECT id, handle, nickname, model, model_year, miles, photo_url FROM cars WHERE member_id=$1 AND deleted_at IS NULL', [me.id])).rows;
        return json(res, 200, { member: { id: me.id, email: me.email, first_name: me.first_name }, cars });
      }
      if (route === 'PATCH /v1/me') {
        const { first_name, avatar_url } = await readBody(req);
        const r = (await pool.query(
          'UPDATE members SET first_name = COALESCE($2, first_name), avatar_url = COALESCE($3, avatar_url) WHERE id=$1 RETURNING id, email, first_name, avatar_url',
          [me.id, first_name ?? null, avatar_url ?? null])).rows[0];
        return json(res, 200, { member: r });
      }
      if (route === 'DELETE /v1/me') { // Apple-required in-app account deletion
        await pool.query('UPDATE members SET deleted_at = now() WHERE id=$1', [me.id]);
        await pool.query('UPDATE sessions SET revoked_at = now() WHERE member_id=$1', [me.id]);
        await audit(pool, `member:${me.id}`, 'account_deleted', `member:${me.id}`);
        return json(res, 200, { ok: true });
      }

      // ---- reports (any member can flag content) ----
      if (route === 'POST /v1/reports') {
        const { subject_kind, subject_id, reason } = await readBody(req);
        if (!['post','reply','car','member'].includes(subject_kind) || !reason?.trim())
          return json(res, 400, { error: 'bad_report' });
        await pool.query(
          'INSERT INTO reports(reporter_member_id, subject_kind, subject_id, reason) VALUES ($1,$2,$3,$4)',
          [me.id, subject_kind, subject_id, reason.trim()]);
        return json(res, 201, { ok: true });
      }

      // ---- admin ----
      if (path.startsWith('/v1/admin/')) {
        if (!isAdmin(me)) return json(res, 403, { error: 'forbidden' });
        return handleAdmin({ pool, me, req, route, path, url, readBody, json, res });
      }

      // ---- cars ----
      if (route === 'POST /v1/cars') {
        const { handle, nickname, model, model_year, miles, photo_url, privacy } = await readBody(req);
        if (!HANDLE_RE.test(handle ?? '')) return json(res, 400, { error: 'invalid_handle' });
        if (!nickname || !model || !Number.isInteger(model_year)) return json(res, 400, { error: 'missing_fields' });
        try {
          const car = (await pool.query(
            `INSERT INTO cars(member_id, handle, nickname, model, model_year, miles, photo_url, privacy)
             VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8, '{"location":"city","public_profile":true,"benchmarking":false,"telemetry":false}'::jsonb))
             RETURNING *`,
            [me.id, handle, nickname, model, model_year, miles ?? 0, photo_url ?? null, privacy ? JSON.stringify(privacy) : null])).rows[0];
          await track(pool, 'car_profile_created', me.id, { car_id: car.id });
          await track(pool, 'car_named', me.id, { car_id: car.id, nickname });
          return json(res, 201, { car });
        } catch (e) {
          if (e.code === '23505') return json(res, 409, { error: 'handle_taken' });
          throw e;
        }
      }
      let m3;
      if ((m3 = path.match(/^\/v1\/cars\/([0-9a-f-]{36})$/)) && req.method === 'PATCH') {
        const own = (await pool.query('SELECT id FROM cars WHERE id=$1 AND member_id=$2 AND deleted_at IS NULL', [m3[1], me.id])).rowCount;
        if (!own) return json(res, 404, { error: 'not_found' });
        const { nickname, miles, photo_url, profile, privacy } = await readBody(req);
        const car = (await pool.query(
          `UPDATE cars SET nickname=COALESCE($2,nickname), miles=COALESCE($3,miles), photo_url=COALESCE($4,photo_url),
             profile = profile || COALESCE($5,'{}'::jsonb), privacy = privacy || COALESCE($6,'{}'::jsonb)
           WHERE id=$1 RETURNING *`,
          [m3[1], nickname ?? null, miles ?? null, photo_url ?? null,
           profile ? JSON.stringify(profile) : null, privacy ? JSON.stringify(privacy) : null])).rows[0];
        return json(res, 200, { car });
      }

      // ---- posts / feed ----
      if (route === 'POST /v1/posts') {
        const { car_id, kind, title, body, media, meta } = await readBody(req);
        const own = (await pool.query('SELECT id FROM cars WHERE id=$1 AND member_id=$2 AND deleted_at IS NULL', [car_id, me.id])).rowCount;
        if (!own) return json(res, 403, { error: 'not_your_car' });
        if (!['photo','milestone','trip_log','question','club_event'].includes(kind)) return json(res, 400, { error: 'bad_kind' });
        const post = (await pool.query(
          `INSERT INTO posts(car_id, kind, title, body, media, meta) VALUES ($1,$2,$3,$4,COALESCE($5,'[]'::jsonb),COALESCE($6,'{}'::jsonb)) RETURNING *`,
          [car_id, kind, title ?? null, body ?? null, media ? JSON.stringify(media) : null, meta ? JSON.stringify(meta) : null])).rows[0];
        if (kind === 'question') await pool.query('INSERT INTO qa_threads(post_id, topic) VALUES ($1,$2)', [post.id, title ?? null]);
        await track(pool, 'post_created', me.id, { post_id: post.id, kind });
        return json(res, 201, { post });
      }
      if (route === 'GET /v1/feed') {
        const before = url.searchParams.get('before');
        const rows = (await pool.query(
          `SELECT p.id, p.kind, p.title, p.body, p.media, p.meta, p.created_at,
                  c.handle, c.nickname, c.model, c.model_year,
                  (SELECT count(*)::int FROM post_likes pl WHERE pl.post_id=p.id) AS likes,
                  (SELECT count(*)::int FROM post_replies pr WHERE pr.post_id=p.id AND pr.status='live') AS replies
           FROM posts p JOIN cars c ON c.id = p.car_id
           WHERE p.status='live' AND c.deleted_at IS NULL AND ($1::timestamptz IS NULL OR p.created_at < $1)
           ORDER BY p.created_at DESC LIMIT 25`, [before])).rows;
        return json(res, 200, { posts: rows, next_before: rows.at(-1)?.created_at ?? null });
      }
      let m4;
      if ((m4 = path.match(/^\/v1\/posts\/([0-9a-f-]{36})\/like$/)) && req.method === 'POST') {
        await pool.query('INSERT INTO post_likes(post_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [m4[1], me.id]);
        return json(res, 200, { ok: true });
      }
      if ((m4 = path.match(/^\/v1\/posts\/([0-9a-f-]{36})\/replies$/)) && req.method === 'POST') {
        const { body } = await readBody(req);
        if (!body?.trim()) return json(res, 400, { error: 'empty' });
        const r = (await pool.query('INSERT INTO post_replies(post_id, member_id, body) VALUES ($1,$2,$3) RETURNING *', [m4[1], me.id, body.trim()])).rows[0];
        return json(res, 201, { reply: r });
      }

      // ---- follows ----
      let m5;
      if ((m5 = path.match(/^\/v1\/cars\/([0-9a-f-]{36})\/follow$/)) && req.method === 'POST') {
        const exists = (await pool.query('SELECT 1 FROM cars WHERE id=$1 AND deleted_at IS NULL', [m5[1]])).rowCount;
        if (!exists) return json(res, 404, { error: 'not_found' });
        const r = await pool.query('INSERT INTO follows(follower_member_id, car_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [me.id, m5[1]]);
        if (r.rowCount) await track(pool, 'follow_created', me.id, { car_id: m5[1] });
        return json(res, 200, { ok: true });
      }
      if ((m5 = path.match(/^\/v1\/cars\/([0-9a-f-]{36})\/follow$/)) && req.method === 'DELETE') {
        await pool.query('DELETE FROM follows WHERE follower_member_id=$1 AND car_id=$2', [me.id, m5[1]]);
        return json(res, 200, { ok: true });
      }

      // ---- clubs ----
      if (route === 'GET /v1/clubs') {
        const rows = (await pool.query(
          `SELECT cl.*, (SELECT count(*)::int FROM club_memberships cm WHERE cm.club_id=cl.id) AS members
           FROM clubs cl ORDER BY cl.name`)).rows;
        return json(res, 200, { clubs: rows });
      }
      let m6;
      if ((m6 = path.match(/^\/v1\/clubs\/([0-9a-f-]{36})\/join$/)) && req.method === 'POST') {
        const exists = (await pool.query('SELECT 1 FROM clubs WHERE id=$1', [m6[1]])).rowCount;
        if (!exists) return json(res, 404, { error: 'not_found' });
        const r = await pool.query('INSERT INTO club_memberships(club_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [m6[1], me.id]);
        if (r.rowCount) await track(pool, 'club_joined', me.id, { club_id: m6[1] });
        return json(res, 200, { ok: true });
      }
      if ((m6 = path.match(/^\/v1\/events\/([0-9a-f-]{36})\/rsvp$/)) && req.method === 'POST') {
        await pool.query('INSERT INTO event_rsvps(event_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [m6[1], me.id]);
        return json(res, 200, { ok: true });
      }

      // ---- marketplace (Phase 1: affiliate only) ----
      if (route === 'GET /v1/products') {
        const rows = (await pool.query('SELECT id, name, image_url, rating, price_cents, fitment_note FROM products ORDER BY created_at DESC LIMIT 100')).rows;
        return json(res, 200, { products: rows, affiliate_disclosure: 'myteslalife earns a commission on marked links.' });
      }
      let m7;
      if ((m7 = path.match(/^\/v1\/cars\/([0-9a-f-]{36})\/mods$/)) && req.method === 'POST') {
        const own = (await pool.query('SELECT id FROM cars WHERE id=$1 AND member_id=$2', [m7[1], me.id])).rowCount;
        if (!own) return json(res, 403, { error: 'not_your_car' });
        const { product_id, note, position } = await readBody(req);
        const r = (await pool.query(
          'INSERT INTO mod_list_items(car_id, product_id, note, position) VALUES ($1,$2,$3,$4) ON CONFLICT (car_id, product_id) DO UPDATE SET note=$3, position=$4 RETURNING *',
          [m7[1], product_id, note ?? null, position ?? 0])).rows[0];
        return json(res, 201, { item: r });
      }

      return json(res, 404, { error: 'not_found' });
    } catch (e) {
      if (e instanceof SyntaxError || e.message === 'body too large') return json(res, 400, { error: 'bad_request' });
      console.error(`[api] ${route}:`, e);
      return json(res, 500, { error: 'internal' });
    }
  });
  return server;
}
