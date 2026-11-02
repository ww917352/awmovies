'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WinEntry } from '@/db/queries';
import { FilmWatchedProvider, useWatchedMap } from '../FilmWatchedContext';
import PinIcon from '../PinIcon';
import { ChevronLeft, ChevronRight } from '../ui/icons';
import AwardCard from './AwardCard';
import YearPicker, { type PickerRow } from './YearPicker';

export type AwardCardData = { slug: string; org: string; prize: string; short: string; winners: WinEntry[] };

// One year of the Awards tab: the five award cards, with ‹ › (and swipe on
// touch screens, ← → on a keyboard) to step a year, and the year picker.
export default function AwardYear({
  year,
  minYear,
  maxYear,
  cards,
  pickerRows,
  initialPinnedYear,
  isLoggedIn,
  lockWatched,
}: {
  year: number;
  minYear: number;
  maxYear: number;
  cards: AwardCardData[];
  pickerRows: PickerRow[];
  initialPinnedYear: number | null;
  isLoggedIn: boolean;
  lockWatched: boolean;
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pinnedYear, setPinnedYear] = useState(initialPinnedYear);
  const prev = year > minYear ? year - 1 : null;
  const next = year < maxYear ? year + 1 : null;

  const winners = useMemo(() => cards.flatMap((c) => c.winners), [cards]);
  // One card per winning film; awards not given this year get none.
  const slots = useMemo(
    () =>
      cards.flatMap((award) =>
        award.winners.map((winner) => ({ award, winner, shared: award.winners.length > 1 }))
      ),
    [cards]
  );
  const initialWatched = useMemo(
    () => Object.fromEntries(winners.map((w) => [w.film.id, w.status.watched])),
    [winners]
  );
  const initialPinned = useMemo(() => Object.fromEntries(winners.map((w) => [w.film.id, w.status.pinned])), [winners]);

  useEffect(() => {
    if (prev) router.prefetch(`/awards/${prev}`);
    if (next) router.prefetch(`/awards/${next}`);
  }, [router, prev, next]);

  // ← → step a year, unless typing or a dialog is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open]')) return;
      if ((e.target as HTMLElement).closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft' && prev) router.push(`/awards/${prev}`);
      if (e.key === 'ArrowRight' && next) router.push(`/awards/${next}`);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, prev, next]);

  // Horizontal swipe: finger moving left goes forward a year, right goes back.
  const touch = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && next) router.push(`/awards/${next}`);
    if (dx > 0 && prev) router.push(`/awards/${prev}`);
  }

  function togglePinYear() {
    const previous = pinnedYear;
    const nextPinned = pinnedYear === year ? null : year;
    setPinnedYear(nextPinned);
    fetch('/api/settings/pinned-year', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: nextPinned }),
    })
      .then((res) => {
        if (!res.ok) setPinnedYear(previous);
      })
      .catch(() => setPinnedYear(previous));
  }

  const isPinned = pinnedYear === year;
  const stepClass = (enabled: boolean) =>
    `grid h-10 w-10 place-items-center rounded-full bg-card shadow-card ${
      enabled ? 'text-tint hover:bg-card-2' : 'pointer-events-none text-label-3 opacity-50'
    }`;

  return (
    <FilmWatchedProvider initial={initialWatched} initialPinned={initialPinned} lockWatched={lockWatched}>
      <div className="page" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <header className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-tint">Awards</p>
            <button
              onClick={() => setPickerOpen(true)}
              className="group flex items-center gap-2"
              aria-label={`${year}, choose another year`}
            >
              <h1 className="text-[44px] sm:text-[56px] font-bold leading-none tracking-tight tabular-nums">{year}</h1>
              <ChevronRight className="w-6 h-6 rotate-90 text-label-3 group-hover:text-label-2" />
            </button>
            {isLoggedIn && <YearProgress filmIds={winners.map((w) => w.film.id)} />}
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={togglePinYear}
                aria-label={isPinned ? 'Unpin this year' : 'Pin this year'}
                className={`flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-[15px] sm:px-4 font-semibold shadow-card ${
                  isPinned ? 'bg-tint text-white dark:text-black' : 'bg-card text-tint hover:bg-card-2'
                }`}
                title={isPinned ? 'Unpin this year' : 'Pin this year to the Pinned tab'}
              >
                <PinIcon filled={isPinned} className="w-4 h-4" />
                <span className="hidden sm:inline">{isPinned ? 'Pinned year' : 'Pin year'}</span>
              </button>
            )}
            <Link
              href={prev ? `/awards/${prev}` : '#'}
              className={stepClass(!!prev)}
              aria-label="Previous year"
              aria-disabled={!prev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link
              href={next ? `/awards/${next}` : '#'}
              className={stepClass(!!next)}
              aria-label="Next year"
              aria-disabled={!next}
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {slots.length === 0 ? (
          <p className="rounded-2xl bg-card px-5 py-10 text-center text-label-2">No awards recorded for {year}.</p>
        ) : (
          // One card per film (a shared prize gives one per winner), all on one
          // row on wide screens; at least five columns so cards keep their size.
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
            style={{ '--cols': Math.max(5, slots.length) } as React.CSSProperties}
          >
            {slots.map((slot) => (
              <AwardCard
                key={`${slot.award.slug}-${slot.winner.film.id}`}
                award={slot.award}
                winner={slot.winner}
                shared={slot.shared}
                year={year}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        )}

        <p className="mt-8 hidden text-center caption sm:block">Use ← → to step through the years</p>
      </div>

      <LiveYearPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        rows={pickerRows}
        cards={cards}
        currentYear={year}
        pinnedYear={pinnedYear}
        showWatched={isLoggedIn}
      />
    </FilmWatchedProvider>
  );
}

// The picker, with this year's row kept in step with ticks made on the page.
function LiveYearPicker({
  rows,
  cards,
  ...props
}: Omit<React.ComponentProps<typeof YearPicker>, 'rows'> & { rows: PickerRow[]; cards: AwardCardData[] }) {
  const watchedMap = useWatchedMap();
  const year = props.currentYear;
  const liveRows = rows.map((row) =>
    row.year !== year
      ? row
      : {
          year,
          cells: cards.map((c) =>
            c.winners.length === 0 ? 0 : c.winners.every((w) => watchedMap[w.film.id] ?? w.status.watched) ? 2 : 1
          ),
        }
  );
  return <YearPicker {...props} rows={liveRows} />;
}

function YearProgress({ filmIds }: { filmIds: number[] }) {
  const watchedMap = useWatchedMap();
  const unique = Array.from(new Set(filmIds));
  const watched = unique.filter((id) => watchedMap[id]).length;
  if (unique.length === 0) return null;
  return (
    <p className="mt-2 text-[15px] text-label-2">
      {watched === unique.length ? (
        <span className="font-semibold text-ok">All {unique.length} watched</span>
      ) : (
        <>
          <span className="font-semibold text-label">{watched}</span> of {unique.length} watched
        </>
      )}
    </p>
  );
}
