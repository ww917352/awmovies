import { getAllWins, getPinnedYear } from '@/db/queries';
import { getCurrentUser } from '@/lib/auth';
import YearScroll from '@/components/YearScroll';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await getCurrentUser();
  const [wins, pinnedYear] = await Promise.all([getAllWins(user?.id ?? null), getPinnedYear(user?.id ?? null)]);
  const years = wins.map((w) => w.year);
  const minYear = years.length ? Math.min(...years) : 1929;
  const maxYear = years.length ? Math.max(...years) : new Date().getFullYear();

  const { year } = await searchParams;
  const requestedYear = year ? parseInt(year, 10) : null;

  return (
    <YearScroll
      wins={wins}
      minYear={minYear}
      maxYear={maxYear}
      initialPinnedYear={pinnedYear}
      requestedYear={Number.isFinite(requestedYear) ? requestedYear : null}
      user={user ? { username: user.username } : null}
    />
  );
}
