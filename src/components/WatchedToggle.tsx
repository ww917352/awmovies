'use client';

import { useTransition } from 'react';
import { useFilmWatched } from './FilmWatchedContext';

export default function WatchedToggle({
  filmId,
  initialWatched,
}: {
  filmId: number;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useFilmWatched(filmId, initialWatched);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !watched;
    setWatched(next);
    startTransition(async () => {
      await fetch(`/api/films/${filmId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watched: next }),
      });
    });
  }

  return (
    <label
      className={`flex items-center gap-1.5 text-xs cursor-pointer select-none shrink-0 ${
        isPending ? 'opacity-60' : ''
      }`}
      title="Watched"
    >
      <input type="checkbox" checked={watched} onChange={toggle} className="accent-emerald-500" />
      <span className="hidden sm:inline text-neutral-400">Watched</span>
    </label>
  );
}
