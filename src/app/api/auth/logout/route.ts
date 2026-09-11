import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/origin-check';

export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}
