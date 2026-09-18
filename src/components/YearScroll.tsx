'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WinEntry } from '@/db/queries';
import FilmRow from './FilmRow';
import QuickNav from './QuickNav';
import PinIcon from './PinIcon';
import { FilmWatchedProvider } from './FilmWatchedContext';

const DEFAULT_YEAR = 2000;

// Feeds `contain-intrinsic-size` below — content-visibility: auto skips
// layout/paint for a section while it's off-screen, but needs a size
// estimate to reserve while skipped (otherwise the page's scrollable
// height would collapse to nothing off-screen and jump around as sections
// come into view). Fit empirically against real rendered section heights
// (linear in win count, R² was strong): ~125px per FilmRow, ~165px fixed
// for the year heading and padding.
const ESTIMATED_FIXED_HEIGHT_PX = 165;
const ESTIMATED_ROW_HEIGHT_PX = 125;
const ESTIMATED_EMPTY_HEIGHT_PX = 140; // years with no recorded win — just a one-line message

function estimateSectionHeight(winCount: number): number {
  if (winCount === 0) return ESTIMATED_EMPTY_HEIGHT_PX;
  return ESTIMATED_FIXED_HEIGHT_PX + ESTIMATED_ROW_HEIGHT_PX * winCount;
}

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
  //
  // Deliberately scrollIntoView() rather than `container.scrollTop =
  // target.offsetTop`: content-visibility: auto (below) always implies
  // layout containment for a section, on top of the size containment that
  // does the actual off-screen skipping — and containment changes margin
  // collapsing, so a section measured via a plain offsetTop read comes out
  // a different height than the same section as the browser actually lays
  // it out once it's on-screen. That mismatch compounds over ~90 years and
  // was landing this jump several thousand pixels short in testing.
  // scrollIntoView is the browser's own content-visibility-aware primitive
  // for this and doesn't have that problem. The container's own
  // scroll-behavior: auto (below) keeps this jump instant, matching the
  // "no visible animation" intent.
  useLayoutEffect(() => {
    const target = sectionRefs.current.get(startYear);
    target?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePinForYear(year: number) {
    const previous = pinnedYear;
    const next = pinnedYear === year ? null : year;
    setPinnedYear(next);
    fetch('/api/settings/pinned-year', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: next }),
    })
      .then((res) => {
        // Roll back if the write didn't actually land (e.g. the session
        // expired) — otherwise the pin icon shows saved when it wasn't.
        if (!res.ok) setPinnedYear(previous);
      })
      .catch(() => setPinnedYear(previous));
  }

  const homeYear = pinnedYear ?? DEFAULT_YEAR;

  // Deliberately instant, not smooth: a smooth scrollIntoView (or a smooth
  // scrollTo aimed at a pixel value measured via a separate instant pass)
  // lands wrong when the target is far away — content-visibility sections
  // along the path switch from estimated to real height *during* the
  // animation, shifting the destination under it mid-flight. Verified this
  // isn't just a bad estimate: it reproduced consistently, landing years
  // away from the actual target, even after re-measuring the exact
  // destination immediately beforehand. Instant scrollIntoView doesn't
  // have this problem (same mechanism the initial-load jump above uses).
  function scrollToHomeYear() {
    const target = sectionRefs.current.get(homeYear);
    target?.scrollIntoView({ block: 'start' });
  }

  return (
    <FilmWatchedProvider initial={initialWatchedMap}>
    <div className="relative">
      <QuickNav
        className="fixed inset-x-0 top-0 z-20"
        targetYear={homeYear}
        isPinned={pinnedYear !== null}
        onYearClick={scrollToHomeYear}
        user={user}
      />

      <div
        className="year-scroll-container h-dvh overflow-y-scroll"
        style={{ scrollBehavior: 'auto' }}
      >
        {years.map((year, index) => {
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
              className={`flex flex-col items-center px-4 ${index === 0 ? 'pt-20' : 'pt-10'} ${
                index === years.length - 1 ? 'pb-[calc(2.5rem+env(safe-area-inset-bottom))]' : 'pb-10'
              }`}
              style={{ containIntrinsicSize: `auto ${estimateSectionHeight(yearWins.length)}px` }}
            >
              <div className="w-full max-w-3xl">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <h1 className="text-5xl sm:text-6xl font-bold">{year}</h1>
                  {user && (
                    <button
                      onClick={() => togglePinForYear(year)}
                      className={`rounded-full p-2 ${
                        isPinned
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400'
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
                      <FilmRow
                        key={`${w.awardSlug}-${w.film.id}`}
                        win={w}
                        isLoggedIn={!!user}
                        backHref={`/?year=${year}`}
                      />
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
