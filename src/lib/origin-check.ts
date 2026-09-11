import type { NextRequest } from 'next/server';

// SameSite=Lax on the session cookie (see createSession in @/lib/auth) already
// blocks cross-site POST/PATCH from carrying it, so this isn't currently
// exploitable — but it's the only thing standing between a cross-site
// mutation and a valid session, and that's a fragile single point of
// failure (a future move to SameSite=None, a same-site subdomain takeover,
// or a browser quirk would remove it). An Origin check is a second,
// independent, stateless line of defense against the same class of attack.
//
// Browsers always send Origin on fetch()/XHR requests with a body — same-
// origin included — so a same-origin request never fails this. Falls back
// to Referer for the rare legitimate client that omits Origin; rejects if
// both are missing, since a same-origin browser request always sends at
// least one.
export function isTrustedOrigin(req: NextRequest): boolean {
  const expected = req.nextUrl.origin;

  const origin = req.headers.get('origin');
  if (origin) return origin === expected;

  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }

  return false;
}
