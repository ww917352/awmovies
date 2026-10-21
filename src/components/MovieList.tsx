'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { ListMembership, ListOnlyEntry, WinEntry } from '@/db/queries';
import FilmRow from './FilmRow';
import WinLabel from './WinLabel';
import ListLabel from './ListLabel';
import QuickNav from './QuickNav';
import { FilmWatchedProvider } from './FilmWatchedContext';
import UnwatchedOnlyToggle from './UnwatchedOnlyToggle';
import { AWARD_ABBR } from '@/lib/format';

type Award = { slug: string; name: string };

// One row on the page: an award win, or a film that's only in lists — which
// has no award year, so it's placed and filtered by its release year and
// labelled "Released" to tell the two apart.
type Row = Pick<WinEntry, 'film' | 'status'> & {
  key: string;
  year: number;
  awardSlug: string | null;
  label: ReactNode;
};

const DEFAULT_YEAR = 2000;

export default function MovieList({
  wins,
  listOnlyFilms,
  listMemberships,
  awards,
  pinnedYear,
  user,
  lockWatched,
}: {
  wins: WinEntry[];
  listOnlyFilms: ListOnlyEntry[];
  listMemberships: Record<number, ListMembership[]>;
  awards: Award[];
  pinnedYear: number | null;
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
      label: (
        <span className="flex flex-wrap gap-x-3">
          <WinLabel year={w.year} awardSlug={w.awardSlug} awardName={w.awardName} />
          {listLabels(w.film.id)}
        </span>
      ),
    }));
    const listRows: Row[] = listOnlyFilms.map((f) => ({
      key: `list-${f.film.id}`,
      film: f.film,
      status: f.status,
      year: f.film.releaseYear,
      awardSlug: null,
      label: (
        <span className="flex flex-wrap gap-x-3">
          <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Released {f.film.releaseYear}</span>
          {listLabels(f.film.id)}
        </span>
      ),
    }));
    // Stable, so within a year the award wins keep their award/title order
    // and list-only films follow them.
    return [...winRows, ...listRows].sort((a, b) => a.year - b.year);
  }, [wins, listOnlyFilms, listMemberships]);

  const years = useMemo(() => {
    const set = new Set(rows.map((r) => r.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((w) => {
      if (awardSlug !== 'all' && w.awardSlug !== awardSlug) return false;
      if (year !== 'all' && w.year !== Number(year)) return false;
      if (hiddenIds?.has(w.film.id)) return false;
      if (query) {
        const haystack = [
          w.film.title,
          w.film.originalTitle,
          ...w.film.directors,
          ...w.film.mainCast,
          ...w.film.studios,
        ]
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

  const initialWatchedMap = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.film.id, r.status.watched])),
    [rows]
  );

  return (
    <FilmWatchedProvider initial={initialWatchedMap} lockWatched={lockWatched}>
    <QuickNav
      className="fixed inset-x-0 top-0 z-20"
      targetYear={pinnedYear ?? DEFAULT_YEAR}
      isPinned={pinnedYear !== null}
      yearHref={`/?year=${pinnedYear ?? DEFAULT_YEAR}`}
      user={user}
    />
    <main className="mx-auto max-w-3xl px-4 pt-20 pb-6">
      <h1 className="text-2xl font-bold mb-4">All Movies</h1>

      <div className="flex flex-wrap gap-3 mb-4 sticky top-12 bg-surface/95 backdrop-blur py-2 -mx-4 px-4 z-10 border-b border-neutral-200 dark:border-neutral-800">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, director, cast…"
          className="bg-card border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-base w-full"
        />

        <select
          value={awardSlug}
          onChange={(e) => setAwardSlug(e.target.value)}
          className="bg-card border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-base"
        >
          <option value="all">All movies</option>
          {awards.map((a) => (
            <option key={a.slug} value={a.slug}>
              {AWARD_ABBR[a.slug] ?? a.name}
            </option>
          ))}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="bg-card border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1.5 text-base"
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <UnwatchedOnlyToggle onChange={setHiddenIds} />
      </div>

      <p className="text-sm text-neutral-500 mb-3">
        {filmCount} film{filmCount === 1 ? '' : 's'}
        {filtered.length !== filmCount && ` · ${filtered.length} entries`}
      </p>

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No films match these filters.</p>
      ) : (
        filtered.map((r) => (
          <FilmRow
            key={r.key}
            film={r.film}
            status={r.status}
            label={r.label}
            isLoggedIn={!!user}
            backHref="/movies"
          />
        ))
      )}
    </main>
    </FilmWatchedProvider>
  );
}
