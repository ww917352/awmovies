import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { getAllAwards, getAllWins, getPinnedYear } from '@/db/queries';
import { AWARD_ABBR, capitalizeWords } from '@/lib/format';
import StatTile from '@/components/StatTile';
import ThemeSettings from '@/components/ThemeSettings';
import LogoutButton from '@/components/LogoutButton';
import QuickNav from '@/components/QuickNav';

export const dynamic = 'force-dynamic';

const DEFAULT_YEAR = 2000;

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  requireUpToDatePassword(user);

  const [wins, awards, pinnedYear] = await Promise.all([getAllWins(user.id), getAllAwards(), getPinnedYear(user.id)]);

  // e.g. "Berlin · Golden Bear, …, Oscar · Int’l Feature and Venice · Golden
  // Lion", alphabetically.
  const awardNames = awards
    .map((a) => AWARD_ABBR[a.slug] ?? a.name)
    .sort((a, b) => a.localeCompare(b));
  const awardList =
    awardNames.length > 1 ? `${awardNames.slice(0, -1).join(', ')} and ${awardNames.at(-1)}` : (awardNames[0] ?? '');

  const filmWatched = new Map<number, boolean>();
  for (const w of wins) filmWatched.set(w.film.id, w.status.watched);
  const totalFilms = filmWatched.size;
  const watchedFilms = Array.from(filmWatched.values()).filter(Boolean).length;

  const winsByYear = new Map<number, typeof wins>();
  for (const w of wins) {
    const list = winsByYear.get(w.year) ?? [];
    list.push(w);
    winsByYear.set(w.year, list);
  }
  const totalYears = winsByYear.size;
  const completedYears = Array.from(winsByYear.values()).filter((list) => list.every((w) => w.status.watched)).length;

  return (
    <>
      <QuickNav
        className="fixed inset-x-0 top-0 z-20"
        targetYear={pinnedYear ?? DEFAULT_YEAR}
        isPinned={pinnedYear !== null}
        yearHref={`/?year=${pinnedYear ?? DEFAULT_YEAR}`}
        user={{ username: user.username }}
      />
      <main className="mx-auto max-w-sm px-4 pt-20 pb-16">
        <h1 className="text-2xl font-bold mb-6">{capitalizeWords(user.username)}</h1>

        <div className="flex flex-col gap-3 mb-3">
          <StatTile label="Award winners watched" value={watchedFilms} total={totalFilms} color="emerald" />
          <StatTile label="Award years completed" value={completedYears} total={totalYears} color="sky" />
        </div>
        <p className="text-sm text-neutral-500 mb-8">
          Only winners of the {awards.length} awards count here: {awardList}. Each{' '}
          <Link href="/lists" prefetch={false} className="text-sky-600 dark:text-sky-400 hover:underline">
            list
          </Link>{' '}
          shows its own progress.
        </p>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral-500 mb-2">Theme</h2>
          <ThemeSettings />
        </div>

        <LogoutButton />
      </main>
    </>
  );
}
