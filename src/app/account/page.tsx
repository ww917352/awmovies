import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAllWins } from '@/db/queries';
import { capitalizeWords } from '@/lib/format';
import StatTile from '@/components/StatTile';
import ThemeSettings from '@/components/ThemeSettings';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ back?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { back } = await searchParams;
  // Only accept a same-site relative path — back is attacker-controlled,
  // and an absolute/protocol-relative URL here would make this an open redirect.
  const backHref = back && back.startsWith('/') && !back.startsWith('//') ? back : '/';

  const wins = await getAllWins(user.id);

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
    <main className="mx-auto max-w-sm px-4 py-16">
      <Link href={backHref} className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
        &larr; Back
      </Link>

      <h1 className="text-2xl font-bold mt-3 mb-6">{capitalizeWords(user.username)}</h1>

      <div className="flex flex-col gap-3 mb-8">
        <StatTile label="Movies watched" value={watchedFilms} total={totalFilms} color="emerald" />
        <StatTile label="Years completed" value={completedYears} total={totalYears} color="sky" />
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 mb-2">Theme</h2>
        <ThemeSettings />
      </div>

      <LogoutButton />
    </main>
  );
}
