import { NextRequest, NextResponse } from 'next/server';
import { PWD_CHANGE_COOKIE } from '@/lib/auth-cookies';

// Runs on the edge, so it only reads a non-secret flag cookie (mirroring
// users.mustChangePassword) rather than hitting the DB — see setMustChangePasswordCookie.
// The DB flag is still the source of truth: requireUpToDatePassword() (src/lib/auth.ts)
// enforces it server-side on every page and mutating route, so this cookie check is a
// fast path, not the only guard.
//
// /login and /api/auth/login must stay reachable even while this flag is
// set: the flag cookie can outlive its session (expired/cleared server-side
// while the cookie itself lingers), and /change-password redirects to
// /login when it finds no valid session — if /login weren't allowed here,
// that would bounce straight back to /change-password forever. The login
// page itself still redirects to /change-password when there IS a valid
// session with mustChangePassword set, so this doesn't weaken the guarantee.
const ALLOWED_WHILE_PENDING = [
  '/change-password',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/change-password',
];

// Poster images are the only third-party content the app embeds.
const IMG_SRC = ["'self'", 'data:', 'https://upload.wikimedia.org', 'https://image.tmdb.org'];

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    // React/Next inline `style={{...}}` attributes need this — a narrower
    // attack surface than unsafe-inline script, and not worth nonce-ing
    // every style prop in the app for.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${IMG_SRC.join(' ')}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const mustChangePassword = req.cookies.get(PWD_CHANGE_COOKIE)?.value === '1';
  const { pathname } = req.nextUrl;

  if (mustChangePassword && !ALLOWED_WHILE_PENDING.some((path) => pathname === path)) {
    const url = req.nextUrl.clone();
    url.pathname = '/change-password';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.headers.set('Content-Security-Policy', csp);
    return res;
  }

  // Forward the nonce as a request header so Server Components (layout.tsx)
  // can read it via next/headers and apply it to our own inline script;
  // Next.js also auto-detects the nonce from the response CSP header below
  // and applies it to its own injected hydration scripts.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
