import Link from 'next/link';
import type { WinEntry } from '@/db/queries';
import WatchedToggle from './WatchedToggle';
import { AWARD_ABBR, formatOwnedLabel } from '@/lib/format';

export default function FilmRow({
  win,
  showYear = false,
  isLoggedIn = false,
  backHref = '/',
}: {
  win: WinEntry;
  showYear?: boolean;
  isLoggedIn?: boolean;
  backHref?: string;
}) {
  const ownedLabel = formatOwnedLabel(win.status);
  const filmHref = `/films/${win.film.id}?back=${encodeURIComponent(backHref)}`;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-card/40 px-3 py-2.5 mb-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">
          {showYear && <span className="text-neutral-700 dark:text-neutral-300 font-semibold mr-1.5">{win.year}</span>}
          {AWARD_ABBR[win.awardSlug] ?? win.awardName}
        </span>
        {isLoggedIn && <WatchedToggle filmId={win.film.id} initialWatched={win.status.watched} />}
      </div>

      <Link href={filmHref} className="block leading-snug mt-1 hover:underline">
        <span className="text-lg font-semibold">{win.film.title}</span>
        {win.film.originalTitle && win.film.originalTitle !== win.film.title && (
          <span className="text-sm text-neutral-500 italic ml-1.5">({win.film.originalTitle})</span>
        )}
      </Link>

      {win.film.directors.length > 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{win.film.directors.join(', ')}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {win.film.wikiUrl && (
          <a href={win.film.wikiUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:underline">
            Wiki
          </a>
        )}
        {win.film.letterboxdUrl && (
          <a
            href={win.film.letterboxdUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Letterboxd
          </a>
        )}
        {win.film.appleTvUrl && (
          <a
            href={win.film.appleTvUrl}
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
