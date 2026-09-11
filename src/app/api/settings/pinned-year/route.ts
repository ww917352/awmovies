import { NextRequest, NextResponse } from 'next/server';
import { setPinnedYear } from '@/db/queries';
import { getCurrentUser } from '@/lib/auth';

// Loose bounds around the real award-year range (earliest ceremony: 1929) —
// just enough to reject nonsense like -1 or 99999999999, which the DB's
// int4 column would otherwise 500 on.
const MIN_YEAR = 1870;
const MAX_YEAR = new Date().getFullYear() + 5;

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  if (typeof body !== 'object' || body === null || !('year' in body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { year } = body as { year: unknown };
  if (year !== null && (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR)) {
    return NextResponse.json({ error: `year must be an integer between ${MIN_YEAR} and ${MAX_YEAR}, or null` }, { status: 400 });
  }

  await setPinnedYear(user.id, year as number | null);
  return NextResponse.json({ pinnedYear: year });
}
