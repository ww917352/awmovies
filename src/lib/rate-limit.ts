import { db } from '@/db/client';
import { rateLimitAttempts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// Small DB-backed limiter for auth endpoints — this app has no Redis/KV, and
// login traffic is low enough that a table with one row per bucket is a
// reasonable fit. Not meant to scale past that; a real cache would be the
// next step if this app ever needed to.
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000;

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

// Call before attempting a login/verification, once per bucket (caller
// checks both an IP-keyed and a username-keyed bucket independently, so
// whichever fills up first locks — a shared IP behind NAT can't lock out a
// specific username by itself, and a single attacker still gets stopped by
// their own IP bucket regardless of which usernames they try).
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  const [row] = await db.select().from(rateLimitAttempts).where(eq(rateLimitAttempts.key, key));
  if (row?.lockedUntil && row.lockedUntil.getTime() > Date.now()) {
    return { allowed: false, retryAfterSeconds: Math.ceil((row.lockedUntil.getTime() - Date.now()) / 1000) };
  }
  return { allowed: true };
}

// Call after a failed attempt. Resets the window if it's expired, otherwise
// increments; locks once MAX_ATTEMPTS is reached within WINDOW_MS.
export async function recordFailedAttempt(key: string): Promise<void> {
  const now = new Date();
  const [row] = await db.select().from(rateLimitAttempts).where(eq(rateLimitAttempts.key, key));

  if (!row || now.getTime() - row.windowStart.getTime() > WINDOW_MS) {
    await db
      .insert(rateLimitAttempts)
      .values({ key, attempts: 1, windowStart: now, lockedUntil: null })
      .onConflictDoUpdate({ target: rateLimitAttempts.key, set: { attempts: 1, windowStart: now, lockedUntil: null } });
    return;
  }

  const attempts = row.attempts + 1;
  const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MS) : null;
  await db.update(rateLimitAttempts).set({ attempts, lockedUntil }).where(eq(rateLimitAttempts.key, key));
}

// Call after a successful attempt, so a genuine user who mistyped their
// password a few times isn't left sitting close to the threshold.
export async function clearAttempts(key: string): Promise<void> {
  await db.delete(rateLimitAttempts).where(eq(rateLimitAttempts.key, key));
}

// Best-effort cleanup, same pattern as pruneExpiredSessions — no background
// job runner, so this runs opportunistically from the login route.
export async function pruneStaleRateLimitRows(): Promise<void> {
  await db.delete(rateLimitAttempts).where(sql`${rateLimitAttempts.windowStart} < now() - interval '1 day'`);
}

// Best-effort client IP extraction behind Vercel's proxy (x-forwarded-for is
// set by Vercel's edge network, not attacker-controlled at that point) with
// a same-site fallback for local dev where it's absent.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
