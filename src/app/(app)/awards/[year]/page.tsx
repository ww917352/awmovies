import { notFound } from 'next/navigation';
import { getAllWins, getUserSettings, type WinEntry } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { AWARDS } from '@/lib/format';
import AwardYear from '@/components/awards/AwardYear';
import type { PickerRow } from '@/components/awards/YearPicker';

export const dynamic = 'force-dynamic';

export default async function AwardYearPage({ params }: { params: Promise<{ year: string }> }) {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);

  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isInteger(year)) notFound();

  const [wins, { pinnedYear, lockWatched }] = await Promise.all([
    getAllWins(user?.id ?? null),
    getUserSettings(user?.id ?? null),
  ]);
  const allYears = wins.map((w) => w.year);
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);
  if (year < minYear || year > maxYear) notFound();

  // year → award slug → winners (a few awards were shared in some years).
  const byYear = new Map<number, Map<string, WinEntry[]>>();
  for (const w of wins) {
    const awards = byYear.get(w.year) ?? new Map<string, WinEntry[]>();
    awards.set(w.awardSlug, [...(awards.get(w.awardSlug) ?? []), w]);
    byYear.set(w.year, awards);
  }

  // One row per year for the picker: per award, 0 = not awarded,
  // 1 = not (all) watched, 2 = watched.
  const pickerRows: PickerRow[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    const awards = byYear.get(y);
    pickerRows.push({
      year: y,
      cells: AWARDS.map(({ slug }) => {
        const winners = awards?.get(slug);
        if (!winners) return 0;
        return winners.every((w) => w.status.watched) ? 2 : 1;
      }),
    });
  }

  const thisYear = byYear.get(year);
  const cards = AWARDS.map((award) => ({ ...award, winners: thisYear?.get(award.slug) ?? [] }));

  return (
    <AwardYear
      year={year}
      minYear={minYear}
      maxYear={maxYear}
      cards={cards}
      pickerRows={pickerRows}
      initialPinnedYear={pinnedYear}
      isLoggedIn={!!user}
      lockWatched={lockWatched}
    />
  );
}
