import Link from 'next/link';
import type { ReactNode } from 'react';
import type { WinEntry } from '@/db/queries';
import Poster from './Poster';
import PinButton from './PinButton';
import WatchedToggle from './WatchedToggle';
import { filmHref, formatOwnedLabel } from '@/lib/format';

type Film = Pick<WinEntry['film'], 'id' | 'title' | 'originalTitle' | 'releaseYear' | 'directors' | 'posterUrl'>;
type Status = Pick<WinEntry['status'], 'watched' | 'ownedFormats' | 'digitalQuality' | 'pinned'>;

// One film in a grouped list (put rows inside a <FilmRows>). `label` is the
// small line above the title — the award and year, a list rank. With
// `returnToRow`, the film page's back link lands on this row instead of the
// top of the page; only use it where a film appears once, since the row id
// must be unique.
export default function FilmRow({
  film,
  status,
  label,
  isLoggedIn = false,
  backHref = '/',
  returnToRow = false,
}: {
  film: Film;
  status: Status;
  label?: ReactNode;
  isLoggedIn?: boolean;
  backHref?: string;
  returnToRow?: boolean;
}) {
  const ownedLabel = formatOwnedLabel(status);
  const rowId = `film-${film.id}`;
  const back = returnToRow ? `${backHref}#${rowId}` : backHref;

  return (
    <div
      id={returnToRow ? rowId : undefined}
      className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
      style={{ scrollMarginTop: 'calc(var(--sticky-top) + 120px)' }}
    >
      <Link href={filmHref(film.id, back)} prefetch={false} className="group flex min-w-0 flex-1 items-center gap-3">
        <Poster src={film.posterUrl} title={film.title} className="w-12 sm:w-14" rounded="rounded" />
        <span className="min-w-0 flex-1">
          {label && <span className="block truncate text-[12px] font-medium text-label-2">{label}</span>}
          <span className="block truncate headline group-hover:underline decoration-label-3 underline-offset-2">
            {film.title}
          </span>
          {film.originalTitle && film.originalTitle !== film.title && (
            <span className="block truncate text-[13px] italic text-label-2">{film.originalTitle}</span>
          )}
          <span className="block truncate text-[13px] text-label-2">
            {[film.directors.join(', '), film.releaseYear].filter(Boolean).join(' · ')}
          </span>
          {ownedLabel && (
            <span className="mt-1 inline-block rounded-full bg-fill px-2 py-px text-[11px] font-medium text-label-2">
              {ownedLabel}
            </span>
          )}
        </span>
      </Link>
      {isLoggedIn && (
        <span className="flex shrink-0 items-center gap-1">
          <PinButton filmId={film.id} initialPinned={status.pinned} />
          <WatchedToggle filmId={film.id} title={film.title} initialWatched={status.watched} />
        </span>
      )}
    </div>
  );
}

// The inset-grouped card a run of FilmRows sits in.
export function FilmRows({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-card divide-y divide-sep ${className}`}>{children}</div>
  );
}
