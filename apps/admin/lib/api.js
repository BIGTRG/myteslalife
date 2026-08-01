'use client';
// Thin client for the myteslalife API. Base URL from env at build, else same-host :8110.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8110` : 'http://localhost:8110');

export function getSession() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('mtl_admin_session');
}
export function setSession(s) {
  if (s) window.localStorage.setItem('mtl_admin_session', s);
  else window.localStorage.removeItem('mtl_admin_session');
}

export async function api(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(getSession() ? { authorization: `Bearer ${getSession()}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
    setSession(null);
    window.location.href = '/login';
  }
  return { status: res.status, data };
}
