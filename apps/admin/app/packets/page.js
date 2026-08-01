'use client';
import { useEffect, useState, useCallback } from 'react';
import { color, radius } from '../theme.js';
import { api, getSession } from '../../lib/api.js';
import { Card, H, Btn, Empty } from '../ui.js';

export default function Packets() {
  const [rows, setRows] = useState(null);
  const load = useCallback(() => api('GET', '/v1/admin/packets').then(r => setRows(r.data.packets)), []);
  useEffect(() => { if (!getSession()) { window.location.href = '/login'; return; } load(); }, [load]);
  if (rows === null) return <Empty>Loading…</Empty>;

  const decide = async (id, decision) => {
    const note = decision === 'rejected' ? window.prompt('Why? (goes back to the agent)') ?? '' : '';
    await api('POST', `/v1/admin/packets/${id}/decide`, { decision, note });
    load();
  };
  return (
    <Card>
      <H>Agent approval queue — T2 packets ({rows.length} pending)</H>
      {!rows.length && <Empty>Nothing waiting on you. Agents route external posts, email campaigns, and budget changes here before anything ships.</Empty>}
      {rows.map(p => (
        <div key={p.id} style={{ borderTop: `1px solid ${color.line}`, padding: '14px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: radius.pill, background: color.card, border: `1px solid ${color.line}`, color: color.muted }}>{p.agent}</span>
            <span style={{ fontSize: 11, color: color.muted }}>{p.kind}</span>
            <span style={{ fontSize: 11, color: color.muted }}>{new Date(p.created_at).toLocaleString()}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{p.title}</div>
          <pre style={{ background: color.card, border: `1px solid ${color.line}`, borderRadius: radius.button,
            padding: 12, fontSize: 12, color: color.muted, whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto' }}>
            {JSON.stringify(p.payload, null, 2)}
          </pre>
          <Btn tone="good" onClick={() => decide(p.id, 'approved')}>Approve</Btn>
          <Btn tone="ghost" onClick={() => decide(p.id, 'rejected')}>Reject</Btn>
        </div>
      ))}
    </Card>
  );
}
