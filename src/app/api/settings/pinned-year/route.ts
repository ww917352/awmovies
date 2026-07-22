import { NextRequest, NextResponse } from 'next/server';
import { setPinnedYear } from '@/db/queries';

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (typeof body !== 'object' || body === null || !('year' in body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { year } = body as { year: unknown };
  if (year !== null && !Number.isInteger(year)) {
    return NextResponse.json({ error: 'year must be an integer or null' }, { status: 400 });
  }

  await setPinnedYear(year as number | null);
  return NextResponse.json({ pinnedYear: year });
}
