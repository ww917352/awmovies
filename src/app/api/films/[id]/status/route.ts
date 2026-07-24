import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { filmStatus, ownedFormatValues, digitalQualityValues } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

type StatusPatch = {
  watched?: boolean;
  watchedDate?: string | null;
  ownedFormats?: string[];
  digitalQuality?: string | null;
  notes?: string | null;
};

function isValidPatch(body: unknown): body is StatusPatch {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;

  if ('watched' in b && typeof b.watched !== 'boolean') return false;
  if ('watchedDate' in b && b.watchedDate !== null && typeof b.watchedDate !== 'string') return false;
  if ('ownedFormats' in b) {
    if (!Array.isArray(b.ownedFormats)) return false;
    if (!b.ownedFormats.every((f) => ownedFormatValues.includes(f))) return false;
  }
  if ('digitalQuality' in b) {
    if (b.digitalQuality !== null && !digitalQualityValues.includes(b.digitalQuality as any)) return false;
  }
  if ('notes' in b && b.notes !== null && typeof b.notes !== 'string') return false;

  return true;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }

  const { id } = await params;
  const filmId = Number(id);
  if (!Number.isInteger(filmId)) {
    return NextResponse.json({ error: 'Invalid film id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!isValidPatch(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const whereClause = and(eq(filmStatus.userId, user.id), eq(filmStatus.filmId, filmId));
  const [existing] = await db.select().from(filmStatus).where(whereClause);

  if (!existing) {
    await db.insert(filmStatus).values({ userId: user.id, filmId, ...body });
  } else {
    await db.update(filmStatus).set(body).where(whereClause);
  }

  const [updated] = await db.select().from(filmStatus).where(whereClause);
  return NextResponse.json(updated);
}
