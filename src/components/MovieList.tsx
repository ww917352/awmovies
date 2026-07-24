'use client';

import { useMemo, useState } from 'react';
import type { WinEntry } from '@/db/queries';
import FilmRow from './FilmRow';
import QuickNav from './QuickNav';
import { FilmWatchedProvider } from './FilmWatchedContext';
import { AWARD_ABBR } from '@/lib/format';

type Award = { slug: string; name: string };

const DEFAULT_YEAR = 2000;

export default function MovieList({
  wins,
  awards,
  pinnedYear,
  user,
}: {
  wins: WinEntry[];
  awards: Award[];
  pinnedYear: number | null;
  user: { username: string } | null;
}) {
  const [awardSlug, setAwardSlug] = useState('all');
  const [year, setYear] = useState('all');
  const [unwatchedOnly, setUnwatchedOnly] = useState(false);
  const [search, setSearch] = useState('');

  const years = useMemo(() => {
    const set = new Set(wins.map((w) => w.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [wins]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return wins.filter((w) => {
      if (awardSlug !== 'all' && w.awardSlug !== awardSlug) return false;
      if (year !== 'all' && w.year !== Number(year)) return false;
      if (unwatchedOnly && w.status.watched) return false;
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
  }, [wins, awardSlug, year, unwatchedOnly, search]);

  const initialWatchedMap = useMemo(
    () => Object.fromEntries(wins.map((w) => [w.film.id, w.status.watched])),
    [wins]
  );

  return (
    <FilmWatchedProvider initial={initialWatchedMap}>
    <QuickNav
      className="fixed top-4 right-4 z-20"
      targetYear={pinnedYear ?? DEFAULT_YEAR}
      isPinned={pinnedYear !== null}
      yearHref={`/?year=${pinnedYear ?? DEFAULT_YEAR}`}
      user={user}
    />
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">All Movies</h1>

      <div className="flex flex-wrap gap-3 mb-4 sticky top-0 bg-surface/95 backdrop-blur py-2 -mx-4 px-4 z-10 border-b border-neutral-200 dark:border-neutral-800">
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
          <option value="all">All awards</option>
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

        <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={unwatchedOnly}
            onChange={(e) => setUnwatchedOnly(e.target.checked)}
            className="accent-emerald-500"
          />
          Unwatched only
        </label>
      </div>

      <p className="text-sm text-neutral-500 mb-3">{filtered.length} films</p>

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No films match these filters.</p>
      ) : (
        filtered.map((w) => (
          <FilmRow
            key={`${w.awardSlug}-${w.year}-${w.film.id}`}
            win={w}
            showYear
            isLoggedIn={!!user}
            backHref="/movies"
          />
        ))
      )}
    </main>
    </FilmWatchedProvider>
  );
}
