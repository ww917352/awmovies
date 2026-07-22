import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSession, setMustChangePasswordCookie, verifyPassword, pruneExpiredSessions } from '@/lib/auth';

export async function POST(req: NextRequest) {
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

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await createSession(user.id);
  await setMustChangePasswordCookie(user.mustChangePassword);
  await pruneExpiredSessions();

  return NextResponse.json({ username: user.username, mustChangePassword: user.mustChangePassword });
}
