'use client';
import { useState, useEffect } from 'react';
import { color, radius } from '../theme.js';
import { api, setSession } from '../../lib/api.js';
import { Card, H, Btn } from '../ui.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [err, setErr] = useState(null);

  // arriving via emailed magic link: /login?token=...
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    (async () => {
      const r = await api('POST', '/v1/auth/redeem', { token });
      if (r.status === 200) { setSession(r.data.session); window.location.href = '/'; }
      else setErr('That link is expired or already used. Request a new one.');
    })();
  }, []);

  return (
    <div style={{ maxWidth: 420, margin: '80px auto' }}>
      <Card>
        <H>Admin sign in</H>
        {sentTo ? (
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            If <b>{sentTo}</b> is on the admin allowlist, a sign-in link is on its way. Open it on this device.
          </div>
        ) : (
          <>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@myteslalife.com"
              style={{ width: '100%', boxSizing: 'border-box', background: color.card, color: color.text,
                border: `1px solid ${color.line}`, borderRadius: radius.button, padding: '11px 13px',
                fontFamily: 'inherit', fontSize: 14, marginBottom: 14 }} />
            <Btn onClick={async () => {
              if (!email.includes('@')) return;
              await api('POST', '/v1/auth/magic-link', { email });
              setSentTo(email);
            }}>Send magic link</Btn>
          </>
        )}
        {err && <div style={{ color: color.warn, fontSize: 13, marginTop: 12 }}>{err}</div>}
      </Card>
    </div>
  );
}
