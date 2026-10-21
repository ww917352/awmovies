'use client';

import { useTransition } from 'react';
import { useFilmWatched, useLockWatched } from './FilmWatchedContext';

export default function WatchedToggle({
  filmId,
  initialWatched,
}: {
  filmId: number;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useFilmWatched(filmId, initialWatched);
  const [isPending, startTransition] = useTransition();
  // With the lock setting on, a watched film can't be unticked here — only
  // from its film page.
  const locked = useLockWatched() && watched;

  function toggle() {
    if (locked) return;
    const previous = watched;
    const next = !watched;
    setWatched(next);
    startTransition(async () => {
      const res = await fetch(`/api/films/${filmId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watched: next }),
      }).catch(() => null);
      // Roll back the optimistic update if the write didn't actually land
      // (e.g. the session expired) — otherwise the checkbox shows saved
      // when it wasn't.
      if (!res || !res.ok) setWatched(previous);
    });
  }

  return (
    <label
      className={`flex items-center gap-1.5 text-xs select-none shrink-0 ${locked ? 'cursor-default' : 'cursor-pointer'} ${
        isPending ? 'opacity-60' : ''
      }`}
      title={locked ? 'Watched — change it on the film page' : 'Watched'}
    >
      <input
        type="checkbox"
        checked={watched}
        onChange={toggle}
        disabled={locked}
        className="accent-emerald-500"
      />
      <span className="hidden sm:inline text-neutral-600 dark:text-neutral-400">Watched</span>
    </label>
  );
}
