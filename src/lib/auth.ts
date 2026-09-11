import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { users, sessions } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { SESSION_COOKIE, PWD_CHANGE_COOKIE } from '@/lib/auth-cookies';

export { SESSION_COOKIE, PWD_CHANGE_COOKIE };
export { hashPassword, verifyPassword, passwordPolicyErrors, generateStrongPassword } from '@/lib/password';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export type SessionUser = {
  id: number;
  username: string;
  mustChangePassword: boolean;
};

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function setMustChangePasswordCookie(mustChange: boolean): Promise<void> {
  const jar = await cookies();
  if (mustChange) {
    jar.set(PWD_CHANGE_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } else {
    jar.delete(PWD_CHANGE_COOKIE);
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
  jar.delete(PWD_CHANGE_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashToken(token)));

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  return { id: row.userId, username: row.username, mustChangePassword: row.mustChangePassword };
}

// Best-effort cleanup, called opportunistically from the login route rather
// than on a schedule — this app has no background job runner.
export async function pruneExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

// Server-side enforcement of the forced-password-change gate, backed by the
// live `users.must_change_password` column (not the pwd_change_required
// cookie middleware.ts reads — that cookie is a fast path the client
// controls, not the source of truth). Call this from every page that isn't
// itself part of the change-password flow; skip it on /login and
// /change-password, which need to stay reachable while pending.
export function requireUpToDatePassword(user: SessionUser | null): void {
  if (user?.mustChangePassword) {
    redirect('/change-password');
  }
}
