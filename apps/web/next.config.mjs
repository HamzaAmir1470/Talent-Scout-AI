import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === 'production';
const origin = (u) => { try { return new URL(u).origin; } catch { return ''; } };
const api = origin(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000');
const ws = process.env.NEXT_PUBLIC_WS_URL ? origin(process.env.NEXT_PUBLIC_WS_URL).replace(/^http/, 'ws') : '';

// Scripts need 'unsafe-inline' for the theme bootstrap and Next.js inline data. Everything else is locked to this site.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${prod ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${api} ${ws} ${prod ? '' : 'ws://localhost:* http://localhost:*'}`.trim(),
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const headers = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(prod ? [{ key: 'Content-Security-Policy', value: csp }, { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  outputFileTracingRoot: path.join(here, '../../'),
  async headers() { return [{ source: '/(.*)', headers }]; },
};
export default nextConfig;
