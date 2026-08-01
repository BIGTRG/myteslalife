// API client. Session kept in memory + AsyncStorage-free fallback (Phase 1: web/dev localStorage).
import { Platform } from 'react-native';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:8110';
let session = null;

export function getSession() {
  if (session) return session;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') session = localStorage.getItem('mtl_session');
  return session;
}
export function setSession(s) {
  session = s;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (s) localStorage.setItem('mtl_session', s); else localStorage.removeItem('mtl_session');
  }
}
export async function api(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(getSession() ? { authorization: `Bearer ${getSession()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
