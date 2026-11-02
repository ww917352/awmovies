'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchFilm } from '@/db/queries';
import Poster from '../Poster';
import PinButton from '../PinButton';
import { filmHref } from '@/lib/format';
import SearchField from '../ui/SearchField';

const MAX_RESULTS = 30;

// Lower-cased with accents stripped, so "amelie" finds "Amélie".
function fold(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

// Type-ahead over every film, sticky at the top of the Pinned tab. Titles
// starting with the query rank first, then other title matches, then
// original-title and director matches. "/" focuses it from anywhere.
export default function QuickSearch({ films, isLoggedIn }: { films: SearchFilm[]; isLoggedIn: boolean }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(
    () =>
      films.map((f) => ({
        film: f,
        title: fold(f.title),
        other: fold([f.originalTitle ?? '', ...f.directors].join(' ')),
      })),
    [films]
  );

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    const scored: { film: SearchFilm; score: number }[] = [];
    for (const entry of index) {
      const score = entry.title.startsWith(q) ? 0 : entry.title.includes(q) ? 1 : entry.other.includes(q) ? 2 : -1;
      if (score >= 0) scored.push({ film: entry.film, score });
    }
    return scored.sort((a, b) => a.score - b.score).slice(0, MAX_RESULTS).map((s) => s.film);
  }, [index, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/' || (e.target as HTMLElement).closest('input, textarea, select')) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="sticky z-20 -mx-4 bg-bg/90 px-4 py-2 backdrop-blur-xl sm:-mx-2 sm:px-2" style={{ top: 'var(--sticky-top)' }}>
      <SearchField ref={inputRef} value={query} onChange={setQuery} placeholder="Search films or directors" />

      {query.trim() && (
        <div className="mt-2 max-h-[60dvh] overflow-y-auto rounded-2xl bg-card shadow-card">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-[15px] text-label-2">No films match “{query.trim()}”</p>
          ) : (
            <ul className="divide-y divide-sep">
              {results.map((film) => (
                <li key={film.id} className="flex items-center gap-3 px-3 py-2">
                  <Link href={filmHref(film.id, '/')} prefetch={false} className="flex min-w-0 flex-1 items-center gap-3">
                    <Poster src={film.posterUrl} title={film.title} className="w-9" rounded="rounded" />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold">{film.title}</span>
                      <span className="block truncate text-[13px] text-label-2">
                        {[film.directors.join(', '), film.releaseYear].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </Link>
                  {isLoggedIn && <PinButton filmId={film.id} initialPinned={film.pinned} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
