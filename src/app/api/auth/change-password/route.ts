import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  createSession,
  getCurrentUser,
  hashPassword,
  passwordPolicyErrors,
  revokeAllSessions,
  setMustChangePasswordCookie,
  verifyPassword,
} from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/origin-check';

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as any).currentPassword !== 'string' ||
    typeof (body as any).newPassword !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };

  const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id));
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const policyErrors = passwordPolicyErrors(newPassword);
  if (policyErrors.length > 0) {
    return NextResponse.json(
      { error: `Password must contain ${policyErrors.join(', ')}.` },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ passwordHash: hashPassword(newPassword), mustChangePassword: false })
    .where(eq(users.id, user.id));

  // Invalidate every session on every device (including this one — a
  // password change is the standard response to a suspected compromise),
  // then issue a fresh session so the browser making this request stays
  // logged in.
  await revokeAllSessions(user.id);
  await createSession(user.id);
  await setMustChangePasswordCookie(false);

  return NextResponse.json({ ok: true });
}
