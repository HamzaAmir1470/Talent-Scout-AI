import axios from 'axios';
import { useAuth } from '@/store/auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL, timeout: 20_000, withCredentials: true });
/** Used for the cookie based endpoints. The custom header blocks cross-site form posts. */
const raw = axios.create({ baseURL, timeout: 15_000, withCredentials: true, headers: { 'x-tsa-client': 'web' } });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let inflight: Promise<boolean> | null = null;

/** Trades the HttpOnly refresh cookie for a fresh access token. Concurrent callers share one request. */
export function refreshSession(): Promise<boolean> {
  if (inflight) return inflight;
  inflight = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { data } = await raw.post('/auth/refresh');
        useAuth.getState().setSession(data.accessToken, data.user);
        return true;
      } catch (e) {
        const status = axios.isAxiosError(e) ? e.response?.status : 0;
        if (status === 401 || status === 403) {
          if (attempt === 0) { await sleep(400); continue; } // another tab may have just rotated the cookie
          useAuth.getState().clear();
        }
        return false;
      }
    }
    return false;
  })().finally(() => { inflight = null; });
  return inflight;
}

export async function signOut() {
  try { await raw.post('/auth/logout'); } catch { /* cookie expires anyway */ }
  useAuth.getState().clear();
}

api.interceptors.request.use((cfg) => {
  const token = useAuth.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config as (typeof err.config & { _retry?: boolean }) | undefined;
    const url: string = cfg?.url ?? '';
    if (err.response?.status === 401 && cfg && !cfg._retry && !/^\/auth\/(login|register|refresh)/.test(url)) {
      cfg._retry = true;
      if (await refreshSession()) {
        cfg.headers.Authorization = `Bearer ${useAuth.getState().token}`;
        return api(cfg);
      }
    }
    return Promise.reject(err);
  },
);

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    if (err.response?.status === 429) return 'Too many requests. Please slow down for a moment.';
    if (err.response?.status === 413) return 'That request is too large.';
    if (!err.response) return 'Cannot reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
