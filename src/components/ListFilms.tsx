'use client';

import { useMemo, useState } from 'react';
import type { ListFilm } from '@/db/queries';
import FilmRow from './FilmRow';
import WatchedProgress from './WatchedProgress';
import WinLabel from './WinLabel';
import { FilmWatchedProvider } from './FilmWatchedContext';

export default function ListFilms({
  films,
  isLoggedIn,
  backHref,
}: {
  films: ListFilm[];
  isLoggedIn: boolean;
  backHref: string;
}) {
  const [search, setSearch] = useState('');
  const [unwatchedOnly, setUnwatchedOnly] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return films.filter((f) => {
      if (unwatchedOnly && f.status.watched) return false;
      if (!query) return true;
      return [f.title, f.originalTitle, ...f.directors, ...f.mainCast, ...f.studios]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [films, search, unwatchedOnly]);

  const initialWatchedMap = useMemo(() => Object.fromEntries(films.map((f) => [f.id, f.status.watched])), [films]);
  const filmIds = useMemo(() => films.map((f) => f.id), [films]);

  if (films.length === 0) {
    return <p className="text-neutral-500 text-center py-8">No films in this list yet.</p>;
  }

  return (
    <FilmWatchedProvider initial={initialWatchedMap}>
      {isLoggedIn && <WatchedProgress filmIds={filmIds} />}

      <div className="flex flex-wrap gap-3 mb-4 sticky top-12 bg-surface/95 backdrop-blur py-2 -mx-4 px-4 z-10 border-b border-neutral-200 dark:border-neutral-800">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, director, cast…"
          className="bg-card border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-base w-full"
        />

        {isLoggedIn && (
          <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unwatchedOnly}
              onChange={(e) => setUnwatchedOnly(e.target.checked)}
              className="accent-emerald-500"
            />
            Unwatched only
          </label>
        )}
      </div>

      <p className="text-sm text-neutral-500 mb-3">{filtered.length} films</p>

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No films match these filters.</p>
      ) : (
        filtered.map((f) => (
          <FilmRow
            key={f.id}
            film={f}
            status={f.status}
            label={
              <span className="flex flex-wrap gap-x-3">
                {f.rank !== null && (
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">No. {f.rank}</span>
                )}
                {f.wins.map((w) => (
                  <WinLabel key={`${w.awardSlug}-${w.year}`} year={w.year} awardSlug={w.awardSlug} awardName={w.awardName} />
                ))}
              </span>
            }
            isLoggedIn={isLoggedIn}
            backHref={backHref}
          />
        ))
      )}
    </FilmWatchedProvider>
  );
}
