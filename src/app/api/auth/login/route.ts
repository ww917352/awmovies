import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, hashPassword, setMustChangePasswordCookie, verifyPassword, pruneExpiredSessions } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/origin-check';

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

  const [user] = await db.select().from(users).where(eq(users.username, normalizedUsername));

  // Always run a scrypt verification, even for an unknown username, so the
  // two failure paths aren't distinguishable by response time.
  const passwordOk = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await createSession(user.id);
  await setMustChangePasswordCookie(user.mustChangePassword);
  await pruneExpiredSessions();

  return NextResponse.json({ username: user.username, mustChangePassword: user.mustChangePassword });
}
