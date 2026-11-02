import { redirect } from 'next/navigation';
import { getAllWins, getPinnedFilms, getSearchFilms, getUserSettings } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { AWARDS } from '@/lib/format';
import PinnedHome, { type YearSlot } from '@/components/pinned/PinnedHome';

export const dynamic = 'force-dynamic';

export default async function PinnedPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  // Old links to a year on the home page (/?year=1994) now live under Awards.
  const { year } = await searchParams;
  if (year && /^\d{4}$/.test(year)) redirect(`/awards/${year}`);

  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const userId = user?.id ?? null;

  const [searchFilms, pinnedFilms, { pinnedYear, lockWatched }, wins] = await Promise.all([
    getSearchFilms(userId),
    getPinnedFilms(userId),
    getUserSettings(userId),
    getAllWins(userId),
  ]);

  // The pinned year's five awards, in Awards-tab order; a shared prize shows
  // its first winner.
  const yearSlots: YearSlot[] | null =
    pinnedYear === null
      ? null
      : AWARDS.map((award) => {
          const win = wins.find((w) => w.year === pinnedYear && w.awardSlug === award.slug);
          return { award: award.short, prize: award.prize, filmId: win?.film.id ?? null };
        });

  const yearFilmIds = pinnedYear === null ? [] : wins.filter((w) => w.year === pinnedYear).map((w) => w.film.id);

  return (
    <PinnedHome
      yearFilmIds={yearFilmIds}
      searchFilms={searchFilms}
      pinnedIds={pinnedFilms.map((f) => f.id)}
      pinnedYear={pinnedYear}
      yearSlots={yearSlots}
      isLoggedIn={!!user}
      lockWatched={lockWatched}
    />
  );
}
