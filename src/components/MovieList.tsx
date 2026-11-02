'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ListMembership, WinEntry } from '@/db/queries';
import FilmRow, { FilmRows } from './FilmRow';
import WinLabel from './WinLabel';
import ListLabel from './ListLabel';
import { FilmWatchedProvider } from './FilmWatchedContext';
import UnwatchedOnlyToggle from './UnwatchedOnlyToggle';
import Chip from './ui/Chip';
import SearchField from './ui/SearchField';
import StickyToolbar from './ui/StickyToolbar';
import { joinLabels } from './ui/joinLabels';

export type MovieFilm = Pick<
  WinEntry['film'],
  'id' | 'title' | 'originalTitle' | 'releaseYear' | 'directors' | 'mainCast' | 'studios'
>;
type MovieWin = Pick<WinEntry, 'year' | 'awardSlug' | 'awardName' | 'status'> & { film: MovieFilm };
type MovieListOnly = Pick<WinEntry, 'status'> & { film: MovieFilm };

// One row on the page: an award win, or a film that's only in lists — which
// has no award year, so it's placed and filtered by its release year and
// labelled "Released" to tell the two apart.
type Row = Pick<MovieWin, 'film' | 'status'> & {
  key: string;
  year: number;
  awardSlug: string | null;
  label: ReactNode;
};


export default function MovieList({
  wins,
  listOnlyFilms,
  listMemberships,
  awards,
  user,
  lockWatched,
}: {
  wins: MovieWin[];
  listOnlyFilms: MovieListOnly[];
  listMemberships: Record<number, ListMembership[]>;
  awards: { slug: string; chip: string }[];
  user: { username: string } | null;
  lockWatched: boolean;
}) {
  const [awardSlug, setAwardSlug] = useState('all');
  const [year, setYear] = useState('all');
  const [hiddenIds, setHiddenIds] = useState<Set<number> | null>(null);
  const [search, setSearch] = useState('');

  const rows = useMemo<Row[]>(() => {
    const listLabels = (filmId: number) =>
      (listMemberships[filmId] ?? []).map((l) => <ListLabel key={l.slug} list={l} />);

    const winRows: Row[] = wins.map((w) => ({
      key: `${w.awardSlug}-${w.year}-${w.film.id}`,
      film: w.film,
      status: w.status,
      year: w.year,
      awardSlug: w.awardSlug,
      label: joinLabels([
        <WinLabel key="win" year={w.year} awardSlug={w.awardSlug} awardName={w.awardName} />,
        ...listLabels(w.film.id),
      ]),
    }));
    const listRows: Row[] = listOnlyFilms.map((f) => ({
      key: `list-${f.film.id}`,
      film: f.film,
      status: f.status,
      year: f.film.releaseYear,
      awardSlug: null,
      label: joinLabels([
        <span key="released" className="font-semibold text-tint">
          Released {f.film.releaseYear}
        </span>,
        ...listLabels(f.film.id),
      ]),
    }));
    // Stable, so within a year the award wins keep their award/title order
    // and list-only films follow them.
    return [...winRows, ...listRows].sort((a, b) => a.year - b.year);
  }, [wins, listOnlyFilms, listMemberships]);

  const years = useMemo(() => Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a), [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((w) => {
      if (awardSlug !== 'all' && w.awardSlug !== awardSlug) return false;
      if (year !== 'all' && w.year !== Number(year)) return false;
      if (hiddenIds?.has(w.film.id)) return false;
      if (query) {
        const haystack = [w.film.title, w.film.originalTitle, ...w.film.directors, ...w.film.mainCast, ...w.film.studios]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [rows, awardSlug, year, hiddenIds, search]);

  // Rows are award wins, so a film that won twice has two rows.
  const filmCount = useMemo(() => new Set(filtered.map((r) => r.film.id)).size, [filtered]);

  const initialWatchedMap = useMemo(() => Object.fromEntries(rows.map((r) => [r.film.id, r.status.watched])), [rows]);
  const initialPinnedMap = useMemo(() => Object.fromEntries(rows.map((r) => [r.film.id, r.status.pinned])), [rows]);

  return (
    <FilmWatchedProvider initial={initialWatchedMap} initialPinned={initialPinnedMap} lockWatched={lockWatched}>
      <div className="page">
        <h1 className="large-title mb-4">Movies</h1>

        <StickyToolbar>
          <SearchField value={search} onChange={setSearch} placeholder="Search title, director, cast" />
          <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Chip on={awardSlug === 'all'} onClick={() => setAwardSlug('all')}>
              All
            </Chip>
            {awards.map((a) => (
              <Chip key={a.slug} on={awardSlug === a.slug} onClick={() => setAwardSlug(awardSlug === a.slug ? 'all' : a.slug)}>
                {a.chip}
              </Chip>
            ))}
            <span className="mx-1 h-5 w-px shrink-0 bg-sep" />
            <label className="relative shrink-0">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Year"
                className={`appearance-none rounded-full py-1.5 pl-3.5 pr-7 text-[16px] font-medium sm:text-[14px] ${
                  year === 'all' ? 'bg-fill text-label' : 'bg-label text-bg'
                }`}
              >
                <option value="all">Any year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▼</span>
            </label>
            {user && <UnwatchedOnlyToggle onChange={setHiddenIds} />}
          </div>
        </StickyToolbar>

        <div className="mb-2 px-1">
          <p className="text-[13px] text-label-2">
            {filmCount} film{filmCount === 1 ? '' : 's'}
            {filtered.length !== filmCount && ` · ${filtered.length} awards`}
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-label-2">No films match these filters.</p>
        ) : (
          <FilmRows>
            {filtered.map((r) => (
              <FilmRow key={r.key} film={r.film} status={r.status} label={r.label} isLoggedIn={!!user} backHref="/movies" />
            ))}
          </FilmRows>
        )}
      </div>
    </FilmWatchedProvider>
  );
}
