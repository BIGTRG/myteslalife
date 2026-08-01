'use client';
import { useEffect, useState } from 'react';
import { color, gradient, radius } from './theme.js';
import { api, getSession } from '../lib/api.js';
import { Card, H, Empty } from './ui.js';

const FUNNEL_ORDER = ['member_registered','car_profile_created','car_named','post_created','follow_created','club_joined','affiliate_click'];

export default function Dashboard() {
  const [m, setM] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  useEffect(() => {
    if (!getSession()) { window.location.href = '/login'; return; }
    api('GET', '/v1/admin/metrics').then(r => {
      if (r.status === 403) setForbidden(true); else setM(r.data);
    });
  }, []);
  if (forbidden) return <Empty>This account is not on the admin allowlist.</Empty>;
  if (!m) return <Empty>Loading…</Empty>;

  const funnel = FUNNEL_ORDER.map(name => ({ name, n: m.funnel_7d.find(f => f.name === name)?.n ?? 0 }));
  const max = Math.max(1, ...funnel.map(f => f.n));
  const stat = (label, value, hero) => (
    <Card key={label} style={{ flex: 1, minWidth: 160, ...(hero ? {
      background: `linear-gradient(${gradient.brand.angleDeg}deg, ${gradient.brand.from}, ${gradient.brand.to})`,
      border: 'none' } : {}) }}>
      <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase',
        color: hero ? color.deep : color.muted, marginBottom: 8, fontWeight: hero ? 600 : 400 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 700, color: hero ? color.deep : color.text }}>{value}</div>
    </Card>
  );
  return (
    <>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {stat('Weekly active cars — north star', m.weekly_active_cars, true)}
        {stat('Members', m.members)}
        {stat('Cars in the garage', m.cars)}
        {stat('Live posts', m.posts)}
        {stat('Affiliate clicks · 7d', m.affiliate_clicks_7d)}
      </div>
      <Card style={{ marginTop: 14 }}>
        <H>Day-1 funnel · last 7 days</H>
        {funnel.map(f => (
          <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
            <div style={{ width: 170, fontSize: 13, color: color.muted }}>{f.name.replaceAll('_', ' ')}</div>
            <div style={{ flex: 1, background: color.card, borderRadius: radius.pill, height: 12 }}>
              <div style={{ width: `${(f.n / max) * 100}%`, minWidth: f.n ? 12 : 0, height: 12, borderRadius: radius.pill,
                background: `linear-gradient(90deg, ${gradient.brand.from}, ${gradient.brand.to})` }} />
            </div>
            <div style={{ width: 46, textAlign: 'right', fontWeight: 600, fontSize: 14 }}>{f.n}</div>
          </div>
        ))}
      </Card>
    </>
  );
}
