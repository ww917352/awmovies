'use client';

import { Fragment, useMemo, useState } from 'react';
import type { ListFilm } from '@/db/queries';
import FilmRow from './FilmRow';
import WatchedProgress from './WatchedProgress';
import WinLabel from './WinLabel';
import { FilmWatchedProvider } from './FilmWatchedContext';
import UnwatchedOnlyToggle from './UnwatchedOnlyToggle';

export default function ListFilms({
  films,
  isLoggedIn,
  lockWatched,
  backHref,
  showYear = false,
}: {
  films: ListFilm[];
  isLoggedIn: boolean;
  lockWatched: boolean;
  backHref: string;
  showYear?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [hiddenIds, setHiddenIds] = useState<Set<number> | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return films.filter((f) => {
      if (hiddenIds?.has(f.id)) return false;
      if (!query) return true;
      return [f.title, f.originalTitle, ...f.directors, ...f.mainCast, ...f.studios]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [films, search, hiddenIds]);

  // How many of the shown films each section heading covers.
  const sectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of filtered) if (f.section !== null) counts.set(f.section, (counts.get(f.section) ?? 0) + 1);
    return counts;
  }, [filtered]);

  const initialWatchedMap = useMemo(() => Object.fromEntries(films.map((f) => [f.id, f.status.watched])), [films]);
  const filmIds = useMemo(() => films.map((f) => f.id), [films]);

  if (films.length === 0) {
    return <p className="text-neutral-500 text-center py-8">No films in this list yet.</p>;
  }

  return (
    <FilmWatchedProvider initial={initialWatchedMap} lockWatched={lockWatched}>
      {isLoggedIn && <WatchedProgress filmIds={filmIds} />}

      <div className="flex flex-wrap gap-3 mb-4 sticky top-12 bg-surface/95 backdrop-blur py-2 -mx-4 px-4 z-10 border-b border-neutral-200 dark:border-neutral-800">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, director, cast…"
          className="bg-card border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-base w-full"
        />

        {isLoggedIn && <UnwatchedOnlyToggle onChange={setHiddenIds} />}
      </div>

      <p className="text-sm text-neutral-500 mb-3">{filtered.length} films</p>

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No films match these filters.</p>
      ) : (
        filtered.map((f, i) => (
          <Fragment key={f.id}>
            {f.section !== null && f.section !== filtered[i - 1]?.section && (
              <h2 className={`text-lg font-semibold mb-2 ${i > 0 ? 'mt-6' : ''}`}>
                {f.section}
                <span className="text-sm font-normal text-neutral-500 ml-2">{sectionCounts.get(f.section)}</span>
              </h2>
            )}
            <FilmRow
              film={f}
              status={f.status}
              label={
                <span className="flex flex-wrap gap-x-3">
                  {f.rank !== null && (
                    <span className="text-neutral-700 dark:text-neutral-300 font-semibold">No. {f.rank}</span>
                  )}
                  {showYear && !f.wins.some((w) => w.year === f.releaseYear) && (
                    <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{f.releaseYear}</span>
                  )}
                  {f.wins.map((w) => (
                    <WinLabel key={`${w.awardSlug}-${w.year}`} year={w.year} awardSlug={w.awardSlug} awardName={w.awardName} />
                  ))}
                </span>
              }
              isLoggedIn={isLoggedIn}
              backHref={backHref}
              returnToRow
            />
          </Fragment>
        ))
      )}
    </FilmWatchedProvider>
  );
}
