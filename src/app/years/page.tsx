import Link from 'next/link';
import { getYearRange, getPinnedYear } from '@/db/queries';
import { getCurrentUser } from '@/lib/auth';
import QuickNav from '@/components/QuickNav';

export const dynamic = 'force-dynamic';

const DEFAULT_YEAR = 2000;

function yearPillClass(isPinned: boolean) {
  return `inline-flex items-center justify-center w-16 py-1.5 rounded-lg border text-sm font-medium hover:border-neutral-400 ${
    isPinned ? 'bg-amber-950 border-amber-700 text-amber-300' : 'bg-card border-neutral-700 text-neutral-200'
  }`;
}

export default async function YearsPage() {
  const user = await getCurrentUser();
  const [{ minYear, maxYear }, pinnedYear] = await Promise.all([
    getYearRange(),
    getPinnedYear(user?.id ?? null),
  ]);

  const decadeStarts: number[] = [];
  for (let d = Math.floor(maxYear / 10) * 10; d >= Math.floor(minYear / 10) * 10; d -= 10) {
    decadeStarts.push(d);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <QuickNav
        className="fixed top-4 right-4 z-20"
        targetYear={pinnedYear ?? DEFAULT_YEAR}
        isPinned={pinnedYear !== null}
        yearHref={`/?year=${pinnedYear ?? DEFAULT_YEAR}`}
        user={user ? { username: user.username } : null}
      />

      <h1 className="text-2xl font-bold mb-4">All Years</h1>

      {pinnedYear !== null && (
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500 mb-2">📌 Pinned Year</h2>
          <Link href={`/?year=${pinnedYear}`} className={yearPillClass(true) + ' text-lg font-bold w-24 h-12'}>
            {pinnedYear}
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {decadeStarts.map((decadeStart) => {
          const from = Math.max(decadeStart, minYear);
          const to = Math.min(decadeStart + 9, maxYear);
          const yearsInDecade: number[] = [];
          for (let y = to; y >= from; y--) yearsInDecade.push(y);

          return (
            <div key={decadeStart}>
              <h2 className="text-lg font-semibold text-neutral-300 mb-2">{decadeStart}s</h2>
              <div className="flex flex-wrap gap-2">
                {yearsInDecade.map((y) => (
                  <Link key={y} href={`/?year=${y}`} className={yearPillClass(y === pinnedYear)}>
                    {y}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
