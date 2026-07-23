'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WinEntry } from '@/db/queries';
import FilmRow from './FilmRow';
import QuickNav from './QuickNav';
import PinIcon from './PinIcon';
import { FilmWatchedProvider } from './FilmWatchedContext';

const DEFAULT_YEAR = 2000;

export default function YearScroll({
  wins,
  minYear,
  maxYear,
  initialPinnedYear,
  requestedYear,
  user,
}: {
  wins: WinEntry[];
  minYear: number;
  maxYear: number;
  initialPinnedYear: number | null;
  requestedYear?: number | null;
  user: { username: string } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());

  // Descending order: latest year at the top (DOM start), earliest at the bottom.
  // Scrolling up (toward DOM start) reveals later years; scrolling down reveals earlier years.
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const winsByYear = useMemo(() => {
    const map = new Map<number, WinEntry[]>();
    for (const w of wins) {
      const list = map.get(w.year) ?? [];
      list.push(w);
      map.set(w.year, list);
    }
    return map;
  }, [wins]);

  const initialWatchedMap = useMemo(
    () => Object.fromEntries(wins.map((w) => [w.film.id, w.status.watched])),
    [wins]
  );

  const startYear = Math.min(Math.max(requestedYear ?? initialPinnedYear ?? DEFAULT_YEAR, minYear), maxYear);
  const [pinnedYear, setPinnedYear] = useState(initialPinnedYear);

  // Jump to the starting year before first paint, with no visible scroll animation.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const target = sectionRefs.current.get(startYear);
    if (container && target) {
      container.scrollTop = target.offsetTop;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePinForYear(year: number) {
    const next = pinnedYear === year ? null : year;
    setPinnedYear(next);
    fetch('/api/settings/pinned-year', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: next }),
    });
  }

  const homeYear = pinnedYear ?? DEFAULT_YEAR;

  function scrollToHomeYear() {
    const container = containerRef.current;
    const target = sectionRefs.current.get(homeYear);
    if (container && target) {
      container.scrollTo({ top: target.offsetTop, behavior: 'smooth' });
    }
  }

  return (
    <FilmWatchedProvider initial={initialWatchedMap}>
    <div className="relative">
      <QuickNav
        className="fixed top-4 right-4 z-20"
        targetYear={homeYear}
        isPinned={pinnedYear !== null}
        onYearClick={scrollToHomeYear}
        user={user}
      />

      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollBehavior: 'auto' }}
      >
        {years.map((year) => {
          const yearWins = winsByYear.get(year) ?? [];
          const isPinned = pinnedYear === year;
          return (
            <section
              key={year}
              data-year={year}
              ref={(el) => {
                if (el) sectionRefs.current.set(year, el);
                else sectionRefs.current.delete(year);
              }}
              className="min-h-screen snap-start flex flex-col items-center justify-center px-4 pt-24 pb-16"
            >
              <div className="w-full max-w-3xl">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <h1 className="text-5xl sm:text-6xl font-bold">{year}</h1>
                  {user && (
                    <button
                      onClick={() => togglePinForYear(year)}
                      className={`rounded-full p-2 ${
                        isPinned ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                      }`}
                      title={isPinned ? 'Unpin this year' : 'Pin this year as the default'}
                      aria-label={isPinned ? 'Unpin this year' : 'Pin this year as the default'}
                    >
                      <PinIcon filled={isPinned} />
                    </button>
                  )}
                </div>
                {yearWins.length === 0 ? (
                  <p className="text-center text-neutral-500">No award recorded for this year.</p>
                ) : (
                  <div>
                    {yearWins.map((w) => (
                      <FilmRow key={`${w.awardSlug}-${w.film.id}`} win={w} isLoggedIn={!!user} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
    </FilmWatchedProvider>
  );
}
