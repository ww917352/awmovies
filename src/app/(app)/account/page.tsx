import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { getAllAwards, getAllWins, getUserSettings } from '@/db/queries';
import { AWARD_ABBR, capitalizeWords } from '@/lib/format';
import StatTile from '@/components/StatTile';
import ThemeSettings from '@/components/ThemeSettings';
import LockWatchedSetting from '@/components/LockWatchedSetting';
import LogoutButton from '@/components/LogoutButton';
import { ChevronRight } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  requireUpToDatePassword(user);

  const [wins, awards, { lockWatched }] = await Promise.all([
    getAllWins(user.id),
    getAllAwards(),
    getUserSettings(user.id),
  ]);

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
    <div className="page narrow">
      <div className="mb-6 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-tint-soft text-[28px] font-semibold text-tint">
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <h1 className="large-title">{capitalizeWords(user.username)}</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile label="Award winners watched" value={watchedFilms} total={totalFilms} />
        <StatTile label="Award years completed" value={completedYears} total={totalYears} />
      </div>
      <p className="mt-2 mb-8 px-4 text-[13px] text-label-2">
        Only winners of the {awards.length} awards count here: {awardList}. Each{' '}
        <Link href="/lists" prefetch={false} className="text-tint hover:underline">
          list
        </Link>{' '}
        shows its own progress.
      </p>

      <h2 className="group-label">Appearance</h2>
      <div className="mb-8 rounded-2xl bg-card px-4 py-3">
        <ThemeSettings />
        <p className="mt-2 text-[13px] text-label-2">Automatic is light from 7am to 7pm and dark otherwise.</p>
      </div>

      <h2 className="group-label">Watched</h2>
      <div className="mb-2 rounded-2xl bg-card px-4 py-3">
        <LockWatchedSetting initialLockWatched={lockWatched} />
      </div>
      <p className="mb-8 px-4 text-[13px] text-label-2">
        Once a film is marked watched, it can’t be unticked from the award, movie or list pages — only from the
        film’s own page.
      </p>

      <h2 className="group-label">Account</h2>
      <div className="mb-3 overflow-hidden rounded-2xl bg-card">
        <Link href="/change-password" className="flex items-center justify-between px-4 py-3 text-[17px] hover:bg-card-2">
          Change password
          <ChevronRight className="w-4 h-4 text-label-3" />
        </Link>
      </div>
      <LogoutButton />
    </div>
  );
}
