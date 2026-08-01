'use client';
import { useEffect, useState } from 'react';
import { color } from '../theme.js';
import { api, getSession } from '../../lib/api.js';
import { Card, H, Btn, Empty } from '../ui.js';

export default function Members() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const search = (term) => api('GET', `/v1/admin/members?q=${encodeURIComponent(term)}`).then(r => setRows(r.data.members));
  useEffect(() => { if (!getSession()) { window.location.href = '/login'; return; } search(''); }, []);

  return (
    <Card>
      <H>Member lookup</H>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search(q)}
          placeholder="email or first name" style={{ flex: 1, background: color.card, color: color.text,
            border: `1px solid ${color.line}`, borderRadius: 12, padding: '10px 13px', fontFamily: 'inherit', fontSize: 14 }} />
        <Btn onClick={() => search(q)}>Search</Btn>
      </div>
      {rows === null ? <Empty>Loading…</Empty> : !rows.length ? <Empty>No members match.</Empty> : rows.map(m => (
        <div key={m.id} style={{ borderTop: `1px solid ${color.line}`, padding: '12px 0', display: 'flex', gap: 12, fontSize: 14 }}>
          <div style={{ flex: 1 }}>
            <b>{m.email}</b>{m.first_name ? ` · ${m.first_name}` : ''}
            {m.deleted_at && <span style={{ color: color.warn }}> · deleted</span>}
          </div>
          <div style={{ color: color.muted }}>{m.cars} car{m.cars === 1 ? '' : 's'}</div>
          <div style={{ color: color.muted }}>joined {new Date(m.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </Card>
  );
}
