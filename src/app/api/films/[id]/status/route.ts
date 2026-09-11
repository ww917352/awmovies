import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { filmStatus, ownedFormatValues, digitalQualityValues } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { isTrustedOrigin } from '@/lib/origin-check';

const NOTES_MAX_LENGTH = 10_000;

type StatusPatch = {
  watched?: boolean;
  watchedDate?: string | null;
  ownedFormats?: string[];
  digitalQuality?: string | null;
  notes?: string | null;
};

// Real calendar-date check, not just shape — rejects e.g. "2024-02-30".
function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

function isValidPatch(body: unknown): body is StatusPatch {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;

  if ('watched' in b && typeof b.watched !== 'boolean') return false;
  if ('watchedDate' in b) {
    if (b.watchedDate !== null && (typeof b.watchedDate !== 'string' || !isValidDateString(b.watchedDate))) {
      return false;
    }
  }
  if ('ownedFormats' in b) {
    if (!Array.isArray(b.ownedFormats)) return false;
    if (!b.ownedFormats.every((f) => ownedFormatValues.includes(f))) return false;
  }
  if ('digitalQuality' in b) {
    if (b.digitalQuality !== null && !digitalQualityValues.includes(b.digitalQuality as any)) return false;
  }
  if ('notes' in b) {
    if (b.notes !== null && (typeof b.notes !== 'string' || b.notes.length > NOTES_MAX_LENGTH)) return false;
  }

  return true;
}

// Whitelists known fields only — never spread the raw body into a writer.
// `body` may carry arbitrary extra keys (e.g. a forged `userId`/`filmId`)
// that happen to match real columns on this table; picking fields by name
// is what keeps a caller from writing into another user's row.
function pickPatch(body: StatusPatch) {
  const patch: Record<string, unknown> = {};
  if ('watched' in body) patch.watched = body.watched;
  if ('watchedDate' in body) patch.watchedDate = body.watchedDate;
  if ('ownedFormats' in body) patch.ownedFormats = body.ownedFormats;
  if ('digitalQuality' in body) patch.digitalQuality = body.digitalQuality;
  if ('notes' in body) patch.notes = body.notes;
  return patch;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const filmId = Number(id);
  if (!Number.isInteger(filmId)) {
    return NextResponse.json({ error: 'Invalid film id' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!isValidPatch(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const patch = pickPatch(body);

  const [updated] = await db
    .insert(filmStatus)
    .values({ userId: user.id, filmId, ...patch })
    .onConflictDoUpdate({ target: [filmStatus.userId, filmStatus.filmId], set: patch })
    .returning();

  return NextResponse.json(updated);
}
