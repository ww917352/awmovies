import { notFound } from 'next/navigation';
import { getAllAwards, getAllWins, getAwardProgress, getUserSettings, getYearRange } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { awardInfo, orderAwards } from '@/lib/format';
import AwardYear from '@/components/awards/AwardYear';
import type { PickerRow } from '@/components/awards/YearPicker';

export const dynamic = 'force-dynamic';

export default async function AwardYearPage({ params }: { params: Promise<{ year: string }> }) {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const userId = user?.id ?? null;

  // Only the canonical form, so /awards/01994 or /awards/+1994 don't
  // duplicate /awards/1994.
  const { year: yearParam } = await params;
  if (!/^\d{4}$/.test(yearParam)) notFound();
  const year = Number(yearParam);

  const [{ minYear, maxYear }, dbAwards, wins, progress, { pinnedYear, lockWatched }] = await Promise.all([
    getYearRange(),
    getAllAwards(),
    getAllWins(userId, { year }),
    getAwardProgress(userId),
    getUserSettings(userId),
  ]);
  if (year < minYear || year > maxYear) notFound();

  const awards = orderAwards(dbAwards).map(awardInfo);

  // One row per year for the picker: per award, 0 = not awarded,
  // 1 = not (all) watched, 2 = watched.
  const progressByYear = new Map<number, Map<string, boolean>>();
  for (const p of progress) {
    const byAward = progressByYear.get(p.year) ?? new Map<string, boolean>();
    byAward.set(p.awardSlug, p.watched);
    progressByYear.set(p.year, byAward);
  }
  const pickerRows: PickerRow[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    const byAward = progressByYear.get(y);
    pickerRows.push({
      year: y,
      cells: awards.map(({ slug }) => {
        const watched = byAward?.get(slug);
        return watched === undefined ? 0 : watched ? 2 : 1;
      }),
    });
  }

  const cards = awards.map(({ slug, org, prize, short }) => ({
    slug,
    org,
    prize,
    short,
    winners: wins.filter((w) => w.awardSlug === slug),
  }));

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
