'use client';
import { usePathname } from 'next/navigation';
import { color, gradient, radius } from './theme.js';
import { getSession, setSession } from '../lib/api.js';

const LINKS = [
  ['/', 'Dashboard'],
  ['/moderation', 'Moderation'],
  ['/members', 'Members'],
  ['/packets', 'Approvals'],
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 26px' }}>
      <div style={{
        width: 34, height: 34, borderRadius: radius.pill, marginRight: 8,
        background: `linear-gradient(${gradient.brand.angleDeg}deg, ${gradient.brand.from}, ${gradient.brand.to})`,
        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, color: color.deep,
      }}>M</div>
      <div style={{ fontWeight: 700, marginRight: 20 }}>myteslalife <span style={{ color: color.muted, fontWeight: 400 }}>mission control</span></div>
      {LINKS.map(([href, label]) => (
        <a key={href} href={href} style={{
          color: path === href ? color.text : color.muted, textDecoration: 'none',
          padding: '7px 14px', borderRadius: radius.button, fontSize: 14,
          background: path === href ? color.card : 'transparent',
          border: `1px solid ${path === href ? color.line : 'transparent'}`,
        }}>{label}</a>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={() => { setSession(null); window.location.href = '/login'; }} style={{
        background: 'transparent', color: color.muted, border: `1px solid ${color.line}`,
        borderRadius: radius.button, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
      }}>{typeof window !== 'undefined' && getSession() ? 'Sign out' : 'Signed out'}</button>
    </nav>
  );
}
