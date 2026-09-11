import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, hashPassword, setMustChangePasswordCookie, verifyPassword, pruneExpiredSessions } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/origin-check';
import { checkRateLimit, clearAttempts, getClientIp, pruneStaleRateLimitRows, recordFailedAttempt } from '@/lib/rate-limit';

// A validly-shaped but unreachable hash to verify against when the username
// doesn't exist, so that branch costs the same scrypt time as a real
// verification — otherwise a non-existent username short-circuits before
// hashing and responds fast enough to enumerate valid usernames by timing.
const DUMMY_HASH = hashPassword(randomBytes(32).toString('hex'));

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as any).username !== 'string' ||
    typeof (body as any).password !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { username, password } = body as { username: string; password: string };
  const normalizedUsername = username.trim().toLowerCase();

  // Two independent buckets: a shared IP (e.g. NAT/office network) can't
  // lock out one specific username by itself, but a single attacker still
  // gets stopped by their own IP bucket regardless of which usernames they
  // try against it.
  const ipKey = `login:ip:${getClientIp(req)}`;
  const userKey = `login:user:${normalizedUsername}`;

  const [ipLimit, userLimit] = await Promise.all([checkRateLimit(ipKey), checkRateLimit(userKey)]);
  const blocked = !ipLimit.allowed ? ipLimit : !userLimit.allowed ? userLimit : null;
  if (blocked) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(blocked.retryAfterSeconds) } }
    );
  }

  const [user] = await db.select().from(users).where(eq(users.username, normalizedUsername));

  // Always run a scrypt verification, even for an unknown username, so the
  // two failure paths aren't distinguishable by response time.
  const passwordOk = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    await Promise.all([recordFailedAttempt(ipKey), recordFailedAttempt(userKey)]);
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await Promise.all([clearAttempts(ipKey), clearAttempts(userKey)]);
  await createSession(user.id);
  await setMustChangePasswordCookie(user.mustChangePassword);
  await pruneExpiredSessions();
  await pruneStaleRateLimitRows();

  return NextResponse.json({ username: user.username, mustChangePassword: user.mustChangePassword });
}
