'use client';

import { useMemo, useState } from 'react';
import type { ListFilm } from '@/db/queries';
import FilmRow, { FilmRows } from './FilmRow';
import SearchField from './ui/SearchField';
import StickyToolbar from './ui/StickyToolbar';
import { joinLabels } from './ui/joinLabels';
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
  progressSection,
}: {
  films: ListFilm[];
  isLoggedIn: boolean;
  lockWatched: boolean;
  backHref: string;
  showYear?: boolean;
  progressSection?: string;
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
  const initialPinnedMap = useMemo(() => Object.fromEntries(films.map((f) => [f.id, f.status.pinned])), [films]);
  // With `progressSection`, the progress bar counts only that section's films,
  // e.g. a director's feature films but not their shorts.
  const progressIds = useMemo(
    () => films.filter((f) => progressSection === undefined || f.section === progressSection).map((f) => f.id),
    [films, progressSection]
  );

  // Consecutive films under the same heading, each run in its own card.
  const groups = useMemo(() => {
    const out: { section: string | null; films: ListFilm[] }[] = [];
    for (const f of filtered) {
      const last = out.at(-1);
      if (last && last.section === f.section) last.films.push(f);
      else out.push({ section: f.section, films: [f] });
    }
    return out;
  }, [filtered]);

  if (films.length === 0) {
    return <p className="py-12 text-center text-label-2">No films in this list yet.</p>;
  }

  return (
    <FilmWatchedProvider initial={initialWatchedMap} initialPinned={initialPinnedMap} lockWatched={lockWatched}>
      {isLoggedIn && <WatchedProgress filmIds={progressIds} noun={progressSection?.toLowerCase()} />}

      <StickyToolbar>
        <SearchField value={search} onChange={setSearch} placeholder="Search title, director, cast" />
        {isLoggedIn && (
          <div className="flex gap-2">
            <UnwatchedOnlyToggle onChange={setHiddenIds} />
          </div>
        )}
      </StickyToolbar>

      <p className="mb-2 px-1 text-[13px] text-label-2">{filtered.length} films</p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-label-2">No films match these filters.</p>
      ) : (
        groups.map((group, gi) => (
          <section key={`${group.section}-${gi}`} className="mb-6">
            {group.section !== null && (
              <h2 className="group-label">
                {group.section} · {sectionCounts.get(group.section)}
              </h2>
            )}
            <FilmRows>
              {group.films.map((f) => (
                <FilmRow
                  key={f.id}
                  film={f}
                  status={f.status}
                  label={joinLabels([
                    ...(f.rank !== null ? [<span key="rank" className="font-semibold text-tint">No. {f.rank}</span>] : []),
                    ...(showYear && !f.wins.some((w) => w.year === f.releaseYear)
                      ? [<span key="year">{f.releaseYear}</span>]
                      : []),
                    ...f.wins.map((w) => (
                      <WinLabel key={`${w.awardSlug}-${w.year}`} year={w.year} awardSlug={w.awardSlug} awardName={w.awardName} />
                    )),
                  ])}
                  isLoggedIn={isLoggedIn}
                  backHref={backHref}
                  returnToRow
                />
              ))}
            </FilmRows>
          </section>
        ))
      )}
    </FilmWatchedProvider>
  );
}

