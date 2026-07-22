import { getAllWins, getPinnedYear } from '@/db/queries';
import YearScroll from '@/components/YearScroll';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: { year?: string } }) {
  const [wins, pinnedYear] = await Promise.all([getAllWins(), getPinnedYear()]);
  const years = wins.map((w) => w.year);
  const minYear = years.length ? Math.min(...years) : 1929;
  const maxYear = years.length ? Math.max(...years) : new Date().getFullYear();

  const requestedYear = searchParams.year ? parseInt(searchParams.year, 10) : null;

  return (
    <YearScroll
      wins={wins}
      minYear={minYear}
      maxYear={maxYear}
      initialPinnedYear={pinnedYear}
      requestedYear={Number.isFinite(requestedYear) ? requestedYear : null}
    />
  );
}
