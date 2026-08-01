'use client';
import { useEffect, useState, useCallback } from 'react';
import { color, radius } from '../theme.js';
import { api, getSession } from '../../lib/api.js';
import { Card, H, Btn, Empty } from '../ui.js';

const STATUS_TONE = { live: 'good', hidden: 'warn', removed: 'warn' };

export default function Moderation() {
  const [data, setData] = useState(null);
  const load = useCallback(() => api('GET', '/v1/admin/moderation').then(r => setData(r.data)), []);
  useEffect(() => { if (!getSession()) { window.location.href = '/login'; return; } load(); }, [load]);
  if (!data) return <Empty>Loading…</Empty>;

  const setStatus = async (id, status) => { await api('POST', `/v1/admin/posts/${id}/status`, { status }); load(); };
  const resolve = async (id, outcome) => { await api('POST', `/v1/admin/reports/${id}/resolve`, { outcome }); load(); };

  return (
    <>
      <Card>
        <H>Open reports ({data.open_reports.length})</H>
        {!data.open_reports.length && <Empty>Queue is clear.</Empty>}
        {data.open_reports.map(r => (
          <div key={r.id} style={{ borderTop: `1px solid ${color.line}`, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}><b>{r.subject_kind}</b> flagged — “{r.reason}”</div>
              <div style={{ fontSize: 12, color: color.muted }}>{new Date(r.created_at).toLocaleString()} · subject {r.subject_id.slice(0, 8)}</div>
            </div>
            {r.subject_kind === 'post' && <Btn small tone="warn" onClick={() => setStatus(r.subject_id, 'removed').then(() => resolve(r.id, 'actioned'))}>Remove + resolve</Btn>}
            <Btn small tone="ghost" onClick={() => resolve(r.id, 'dismissed')}>Dismiss</Btn>
          </div>
        ))}
      </Card>
      <Card style={{ marginTop: 14 }}>
        <H>Recent posts</H>
        {data.recent_posts.map(p => (
          <div key={p.id} style={{ borderTop: `1px solid ${color.line}`, padding: '12px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>@{p.handle} · <b>{p.title || p.kind}</b></div>
              <div style={{ fontSize: 12, color: color.muted, maxWidth: 640, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.body || '—'}</div>
            </div>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: radius.pill, border: `1px solid ${color.line}`,
              color: p.status === 'live' ? color.good : color.warn }}>{p.status}</span>
            {p.status === 'live'
              ? <Btn small tone="ghost" onClick={() => setStatus(p.id, 'hidden')}>Hide</Btn>
              : <Btn small tone="ghost" onClick={() => setStatus(p.id, 'live')}>Restore</Btn>}
            {p.status !== 'removed' && <Btn small tone="warn" onClick={() => setStatus(p.id, 'removed')}>Remove</Btn>}
          </div>
        ))}
      </Card>
    </>
  );
}
