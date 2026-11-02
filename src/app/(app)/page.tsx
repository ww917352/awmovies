import { redirect } from 'next/navigation';
import { getAllWins, getFilmPosters, getPinnedFilmIds, getSearchFilms, getUserSettings } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { orderAwards } from '@/lib/format';
import PinnedHome, { type YearSlot } from '@/components/pinned/PinnedHome';

export const dynamic = 'force-dynamic';

export default async function PinnedPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  // Old links to a year on the home page (/?year=1994) now live under Awards.
  const { year } = await searchParams;
  if (year && /^\d{4}$/.test(year)) redirect(`/awards/${year}`);

  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const userId = user?.id ?? null;

  const [searchFilms, pinnedIds, { pinnedYear, lockWatched }] = await Promise.all([
    getSearchFilms(userId),
    getPinnedFilmIds(userId),
    getUserSettings(userId),
  ]);
  const [yearWins, posters] = await Promise.all([
    pinnedYear === null ? [] : getAllWins(userId, { year: pinnedYear }),
    getFilmPosters(pinnedIds),
  ]);

  // The pinned year's winners, one per film, in Awards-tab order.
  const yearSlots: YearSlot[] | null =
    pinnedYear === null
      ? null
      : orderAwards(yearWins.map((w) => ({ ...w, slug: w.awardSlug }))).map((w) => ({
          awardSlug: w.awardSlug,
          awardName: w.awardName,
          organization: w.organization,
          filmId: w.film.id,
          title: w.film.title,
          posterUrl: w.film.posterUrl,
        }));

  return (
    <PinnedHome
      searchFilms={searchFilms}
      pinnedIds={pinnedIds}
      posters={posters}
      pinnedYear={pinnedYear}
      yearSlots={yearSlots}
      isLoggedIn={!!user}
      lockWatched={lockWatched}
    />
  );
}
