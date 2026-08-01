'use client';
import { color, radius } from './theme.js';

export const Card = ({ children, style }) => (
  <div style={{ background: color.deep2, border: `1px solid ${color.line}`, borderRadius: radius.card, padding: 20, ...style }}>{children}</div>
);
export const H = ({ children }) => (
  <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: color.muted, marginBottom: 10 }}>{children}</div>
);
export const Btn = ({ children, onClick, tone = 'brand', small }) => (
  <button onClick={onClick} style={{
    background: tone === 'ghost' ? 'transparent' : tone === 'warn' ? color.warn : tone === 'good' ? color.good : color.brand,
    color: tone === 'ghost' ? color.muted : color.deep,
    border: tone === 'ghost' ? `1px solid ${color.line}` : 'none',
    borderRadius: radius.button, padding: small ? '5px 10px' : '9px 16px',
    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: small ? 12 : 14, marginRight: 8,
  }}>{children}</button>
);
export const Empty = ({ children }) => (
  <div style={{ color: color.muted, padding: '18px 0', fontSize: 14 }}>{children}</div>
);
