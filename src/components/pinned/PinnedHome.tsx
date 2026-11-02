'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { SearchFilm } from '@/db/queries';
import { FilmWatchedProvider, usePinnedIds, useWatchedMap } from '../FilmWatchedContext';
import Poster from '../Poster';
import PinButton from '../PinButton';
import WatchedToggle from '../WatchedToggle';
import { awardInfo, filmHref } from '@/lib/format';
import { gridCols } from '../ui/gridCols';
import { CheckIcon, ChevronRight } from '../ui/icons';
import QuickSearch from './QuickSearch';

// One winning film of the pinned year, for the year strip.
export type YearSlot = {
  awardSlug: string;
  awardName: string;
  organization: string;
  filmId: number;
  title: string;
  posterUrl: string | null;
};

// `posters` covers the films pinned when the page loaded; films pinned from
// the search show a placeholder until the refresh that follows the pin.
export default function PinnedHome({
  searchFilms,
  pinnedIds,
  posters,
  pinnedYear,
  yearSlots,
  isLoggedIn,
  lockWatched,
}: {
  searchFilms: SearchFilm[];
  pinnedIds: number[];
  posters: Record<number, string | null>;
  pinnedYear: number | null;
  yearSlots: YearSlot[] | null;
  isLoggedIn: boolean;
  lockWatched: boolean;
}) {
  const initialWatched = useMemo(() => Object.fromEntries(searchFilms.map((f) => [f.id, f.watched])), [searchFilms]);
  const initialPinned = useMemo(() => Object.fromEntries(searchFilms.map((f) => [f.id, f.pinned])), [searchFilms]);
  const filmsById = useMemo(() => new Map(searchFilms.map((f) => [f.id, f])), [searchFilms]);

  return (
    <FilmWatchedProvider
      initial={initialWatched}
      initialPinned={initialPinned}
      initialPinnedOrder={pinnedIds}
      lockWatched={lockWatched}
    >
      <div className="page">
        <h1 className="large-title mb-4">Pinned</h1>

        <QuickSearch films={searchFilms} isLoggedIn={isLoggedIn} />

        {isLoggedIn ? (
          <>
            <NowWatching filmsById={filmsById} posters={posters} />
            <PinnedYear year={pinnedYear} slots={yearSlots} />
          </>
        ) : (
          <InviteOnly />
        )}
      </div>
    </FilmWatchedProvider>
  );
}

function NowWatching({
  filmsById,
  posters,
}: {
  filmsById: Map<number, SearchFilm>;
  posters: Record<number, string | null>;
}) {
  const shown = usePinnedIds().flatMap((id) => filmsById.get(id) ?? []);

  return (
    <section className="mt-8">
      <h2 className="group-label">Now watching</h2>
      {shown.length === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-8 text-center">
          <p className="headline">Nothing pinned yet</p>
          <p className="mt-1 text-[15px] text-label-2">
            Search above, or tap the pin on any film, to keep what you’re watching here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
          {shown.map((film) => (
            <article key={film.id} className="flex min-w-0 flex-col">
              {/* The title below links to the same page; this one is for pointer users. */}
              <Link href={filmHref(film.id, '/')} prefetch={false} tabIndex={-1} aria-hidden>
                <Poster src={posters[film.id] ?? null} title={film.title} size="md" className="w-full shadow-card" rounded="rounded-lg" />
              </Link>
              <Link
                href={filmHref(film.id, '/')}
                prefetch={false}
                className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug"
              >
                {film.title}
              </Link>
              <p className="truncate text-[12px] text-label-2">
                {[film.directors[0], film.releaseYear].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-1.5 flex items-center justify-between">
                <WatchedToggle filmId={film.id} title={film.title} initialWatched={film.watched} />
                <PinButton filmId={film.id} initialPinned />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PinnedYear({ year, slots }: { year: number | null; slots: YearSlot[] | null }) {
  const watchedMap = useWatchedMap();

  if (year === null || slots === null) {
    return (
      <section className="mt-10">
        <h2 className="group-label">Your year</h2>
        <Link href="/awards" className="flex items-center justify-between gap-3 rounded-2xl bg-card px-5 py-4 hover:bg-card-2">
          <span>
            <span className="headline block">Pick a year to follow</span>
            <span className="text-[15px] text-label-2">Open Awards and tap “Pin year”.</span>
          </span>
          <ChevronRight className="w-5 h-5 text-label-3" />
        </Link>
      </section>
    );
  }

  // Counts every winner, shared prizes included, as the Awards tab does.
  const unique = Array.from(new Set(slots.map((s) => s.filmId)));
  const watched = unique.filter((id) => watchedMap[id]).length;
  const total = unique.length;

  return (
    <section className="mt-10 lg:max-w-3xl">
      <div className="flex items-baseline justify-between pr-1">
        <h2 className="group-label">Your year · {year}</h2>
        <Link href={`/awards/${year}`} className="flex items-center gap-0.5 text-[15px] text-tint">
          Open <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="rounded-2xl bg-card p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
            <div
              className="h-full rounded-full bg-ok-bright transition-[width] duration-300"
              style={{ width: `${total ? (watched / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[13px] text-label-2 tabular-nums">
            {watched} of {total} watched
          </span>
        </div>
        <div className="grid grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-2 sm:gap-4" style={gridCols(slots.length)}>
          {slots.map((slot) => {
            const award = awardInfo({ slug: slot.awardSlug, organization: slot.organization, name: slot.awardName });
            return (
              <div key={`${slot.awardSlug}-${slot.filmId}`} className="min-w-0">
                <Link
                  href={filmHref(slot.filmId, '/')}
                  prefetch={false}
                  className="relative block"
                  title={slot.title}
                  aria-label={`${slot.title}, ${award.label}`}
                >
                  <Poster src={slot.posterUrl} title={slot.title} size="sm" className="w-full" rounded="rounded-md" />
                  {watchedMap[slot.filmId] && (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ok-bright text-white shadow">
                      <CheckIcon className="w-3 h-3" />
                    </span>
                  )}
                </Link>
                <p className="mt-1.5 truncate text-center text-[11px] font-medium text-label-2" title={award.label} aria-hidden>
                  {award.chip}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function InviteOnly() {
  return (
    <section className="mt-8 rounded-2xl bg-card px-5 py-6 text-center">
      <p className="headline">Palmarès is invite only</p>
      <p className="mx-auto mt-1 max-w-md text-[15px] text-label-2">
        Anyone can browse the awards, lists and films. With an invitation you can log in to pin what you’re watching
        and keep track of what you’ve seen.
      </p>
      <Link
        href="/login"
        className="mt-4 inline-block rounded-full bg-tint px-5 py-2 text-[15px] font-semibold text-white dark:text-black"
      >
        Log in
      </Link>
    </section>
  );
}
