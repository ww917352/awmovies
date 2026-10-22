'use client';

import { useMemo } from 'react';
import { useWatchedMap } from './FilmWatchedContext';

export default function WatchedProgress({ filmIds, noun = 'movies' }: { filmIds: number[]; noun?: string }) {
  const watchedMap = useWatchedMap();

  const { watched, total, pct } = useMemo(() => {
    const total = filmIds.length;
    const watched = filmIds.filter((id) => watchedMap[id]).length;
    const pct = total ? Math.round((watched / total) * 100) : 0;
    return { watched, total, pct };
  }, [filmIds, watchedMap]);

  return (
    <div className="mb-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{watched}</span> of {total} {noun} watched ({pct}%)
      </p>
      <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
