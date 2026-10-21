import Link from 'next/link';
import type { ReactNode } from 'react';
import type { WinEntry } from '@/db/queries';
import WatchedToggle from './WatchedToggle';
import { formatOwnedLabel } from '@/lib/format';

// `label` is the small caps line above the title — the award (and year) on
// the year/movie pages, the film's wins on a list.
export default function FilmRow({
  film,
  status,
  label,
  isLoggedIn = false,
  backHref = '/',
}: {
  film: WinEntry['film'];
  status: WinEntry['status'];
  label: ReactNode;
  isLoggedIn?: boolean;
  backHref?: string;
}) {
  const ownedLabel = formatOwnedLabel(status);
  const filmHref = `/films/${film.id}?back=${encodeURIComponent(backHref)}`;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-card/40 px-3 py-2.5 mb-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</span>
        {isLoggedIn && <WatchedToggle filmId={film.id} initialWatched={status.watched} />}
      </div>

      <Link href={filmHref} className="block leading-snug mt-1 hover:underline">
        <span className="text-lg font-semibold">{film.title}</span>
        {film.originalTitle && film.originalTitle !== film.title && (
          <span className="text-sm text-neutral-500 italic ml-1.5">({film.originalTitle})</span>
        )}
      </Link>

      {film.directors.length > 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{film.directors.join(', ')}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {film.wikiUrl && (
          <a href={film.wikiUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
            Wiki
          </a>
        )}
        {film.letterboxdUrl && (
          <a
            href={film.letterboxdUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Letterboxd
          </a>
        )}
        {film.appleTvUrl && (
          <a
            href={film.appleTvUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
          >
            Apple TV
          </a>
        )}
        {ownedLabel && (
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">
            {ownedLabel}
          </span>
        )}
      </div>
    </div>
  );
}
