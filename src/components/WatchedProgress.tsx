'use client';

import { useMemo } from 'react';
import { useWatchedMap } from './FilmWatchedContext';

export default function WatchedProgress({ filmIds, noun = 'films' }: { filmIds: number[]; noun?: string }) {
  const watchedMap = useWatchedMap();

  const { watched, total, pct } = useMemo(() => {
    const total = filmIds.length;
    const watched = filmIds.filter((id) => watchedMap[id]).length;
    const pct = total ? Math.round((watched / total) * 100) : 0;
    return { watched, total, pct };
  }, [filmIds, watchedMap]);

  return (
    <div className="mb-4 rounded-2xl bg-card px-4 py-3">
      <p className="mb-2 flex items-baseline justify-between text-[15px] text-label-2">
        <span>
          <span className="font-semibold text-label">{watched}</span> of {total} {noun} watched
        </span>
        <span className="tabular-nums">{pct}%</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-fill">
        <div className="h-full rounded-full bg-ok-bright transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
