import { NextRequest, NextResponse } from 'next/server';
import { setLockWatched } from '@/db/queries';
import { getCurrentUser } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/origin-check';

export async function PATCH(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  if (user.mustChangePassword) {
    return NextResponse.json({ error: 'Password change required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (typeof body !== 'object' || body === null || typeof (body as { lockWatched?: unknown }).lockWatched !== 'boolean') {
    return NextResponse.json({ error: 'lockWatched must be a boolean' }, { status: 400 });
  }

  const { lockWatched } = body as { lockWatched: boolean };
  await setLockWatched(user.id, lockWatched);
  return NextResponse.json({ lockWatched });
}
