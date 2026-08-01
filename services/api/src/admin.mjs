// Admin routes — mounted by app.mjs. Access: member email in ADMIN_EMAILS allowlist.
import { audit } from '@mtl/db';

export function isAdmin(member, allow = process.env.ADMIN_EMAILS ?? '') {
  return allow.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    .includes(member.email.toLowerCase());
}

export async function handleAdmin({ pool, me, req, route, path, url, readBody, json, res }) {
  // metrics: weekly active cars = cars with a post/like/reply/follow-received in last 7d
  if (route === 'GET /v1/admin/metrics') {
    const q = async (sql) => (await pool.query(sql)).rows[0].c;
    const [members, cars, posts, wac, clicks] = await Promise.all([
      q(`SELECT count(*)::int c FROM members WHERE deleted_at IS NULL`),
      q(`SELECT count(*)::int c FROM cars WHERE deleted_at IS NULL`),
      q(`SELECT count(*)::int c FROM posts WHERE status='live'`),
      q(`SELECT count(DISTINCT c.id)::int c FROM cars c WHERE c.deleted_at IS NULL AND (
           EXISTS (SELECT 1 FROM posts p WHERE p.car_id=c.id AND p.created_at > now()-interval '7 days')
           OR EXISTS (SELECT 1 FROM follows f WHERE f.car_id=c.id AND f.created_at > now()-interval '7 days'))`),
      q(`SELECT count(*)::int c FROM tracking_events WHERE name='affiliate_click' AND created_at > now()-interval '7 days'`),
    ]);
    const funnel = (await pool.query(
      `SELECT name, count(*)::int n FROM tracking_events
       WHERE created_at > now()-interval '7 days' GROUP BY name`)).rows;
    return json(res, 200, { members, cars, posts, weekly_active_cars: wac, affiliate_clicks_7d: clicks, funnel_7d: funnel });
  }

  if (route === 'GET /v1/admin/members') {
    const qs = url.searchParams.get('q') ?? '';
    const rows = (await pool.query(
      `SELECT m.id, m.email, m.first_name, m.created_at, m.deleted_at,
              (SELECT count(*)::int FROM cars c WHERE c.member_id=m.id AND c.deleted_at IS NULL) AS cars
       FROM members m WHERE m.email ILIKE $1 OR m.first_name ILIKE $1
       ORDER BY m.created_at DESC LIMIT 50`, [`%${qs}%`])).rows;
    return json(res, 200, { members: rows });
  }

  if (route === 'GET /v1/admin/moderation') {
    const reports = (await pool.query(
      `SELECT * FROM reports WHERE status='open' ORDER BY created_at LIMIT 100`)).rows;
    const recent = (await pool.query(
      `SELECT p.id, p.kind, p.title, p.body, p.status, p.created_at, c.handle
       FROM posts p JOIN cars c ON c.id=p.car_id ORDER BY p.created_at DESC LIMIT 50`)).rows;
    return json(res, 200, { open_reports: reports, recent_posts: recent });
  }

  let m;
  if ((m = path.match(/^\/v1\/admin\/posts\/([0-9a-f-]{36})\/status$/)) && req.method === 'POST') {
    const { status } = await readBody(req);
    if (!['live','hidden','removed'].includes(status)) return json(res, 400, { error: 'bad_status' });
    await pool.query('UPDATE posts SET status=$2 WHERE id=$1', [m[1], status]);
    await audit(pool, `admin:${me.id}`, 'post_status', `post:${m[1]}`, { status });
    return json(res, 200, { ok: true });
  }
  if ((m = path.match(/^\/v1\/admin\/reports\/([0-9a-f-]{36})\/resolve$/)) && req.method === 'POST') {
    const { outcome } = await readBody(req); // actioned | dismissed
    if (!['actioned','dismissed'].includes(outcome)) return json(res, 400, { error: 'bad_outcome' });
    await pool.query(`UPDATE reports SET status=$2, resolved_by=$3, resolved_at=now() WHERE id=$1`, [m[1], outcome, `admin:${me.id}`]);
    return json(res, 200, { ok: true });
  }

  if (route === 'GET /v1/admin/packets') {
    const rows = (await pool.query(`SELECT * FROM approval_packets WHERE status='pending' ORDER BY created_at LIMIT 100`)).rows;
    return json(res, 200, { packets: rows });
  }
  if ((m = path.match(/^\/v1\/admin\/packets\/([0-9a-f-]{36})\/decide$/)) && req.method === 'POST') {
    const { decision, note } = await readBody(req);
    if (!['approved','rejected'].includes(decision)) return json(res, 400, { error: 'bad_decision' });
    const r = await pool.query(
      `UPDATE approval_packets SET status=$2, decided_by=$3, decided_at=now(), decision_note=$4
       WHERE id=$1 AND status='pending'`, [m[1], decision, `admin:${me.id}`, note ?? null]);
    if (!r.rowCount) return json(res, 409, { error: 'already_decided' });
    await audit(pool, `admin:${me.id}`, 'packet_' + decision, `packet:${m[1]}`, { note });
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'not_found' });
}
