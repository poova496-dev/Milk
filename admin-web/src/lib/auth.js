const SESSION_KEY = 'mmf_admin_session';
const CREDS_KEY = 'mmf_admin_creds';

export const DEFAULT_ADMIN_ID = 'Admin';
export const DEFAULT_ADMIN_PASSWORD = '852585';

export function getAdminCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return { id: DEFAULT_ADMIN_ID, password: DEFAULT_ADMIN_PASSWORD };
}

export function setAdminCreds(id, password) {
  localStorage.setItem(CREDS_KEY, JSON.stringify({ id: id.trim(), password }));
}

export function verifyAdmin(id, password) {
  const creds = getAdminCreds();
  return id === creds.id && password === creds.password;
}

export function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ type: 'admin', at: Date.now() }));
}

export function loadSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** SHA-256 hex — same algorithm as the mobile app (expo-crypto). */
export async function hashPassword(plain) {
  const data = new TextEncoder().encode(String(plain));
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
