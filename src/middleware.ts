import { NextRequest, NextResponse } from 'next/server';
import { PWD_CHANGE_COOKIE } from '@/lib/auth-cookies';

// Runs on the edge, so it only reads a non-secret flag cookie (mirroring
// users.mustChangePassword) rather than hitting the DB — see setMustChangePasswordCookie.
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

export function middleware(req: NextRequest) {
  const mustChangePassword = req.cookies.get(PWD_CHANGE_COOKIE)?.value === '1';
  if (!mustChangePassword) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (ALLOWED_WHILE_PENDING.some((path) => pathname === path)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/change-password';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
