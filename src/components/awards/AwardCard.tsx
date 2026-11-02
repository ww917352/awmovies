import Link from 'next/link';
import Poster from '../Poster';
import PinButton from '../PinButton';
import WatchedToggle from '../WatchedToggle';
import { filmHref } from '@/lib/format';
import type { WinEntry } from '@/db/queries';
import type { AwardCardData } from './AwardYear';

// One winning film of one award. A shared prize gets a card per film, each
// tagged "Shared". Poster beside the text on phones, above it on wider screens,
// where the card spans two rows of the year grid as a subgrid so a header
// that wraps (e.g. "International Feature") doesn't push its poster down.
export default function AwardCard({
  award,
  winner,
  shared,
  year,
  isLoggedIn,
}: {
  award: Pick<AwardCardData, 'org' | 'prize'>;
  winner: WinEntry;
  shared: boolean;
  year: number;
  isLoggedIn: boolean;
}) {
  const back = `/awards/${year}`;
  return (
    <section className="flex flex-col rounded-2xl bg-card p-3 shadow-card sm:row-span-2 sm:grid sm:grid-rows-subgrid sm:gap-0 sm:p-3.5">
      <header className="mb-2 px-0.5 sm:mb-2.5">
        <p className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-label-2">
          {award.org}
          {shared && <span className="rounded-full bg-tint-soft px-1.5 py-px text-[10px] text-tint">Shared</span>}
        </p>
        <h2 className="headline leading-tight">{award.prize}</h2>
      </header>

      <article className="flex flex-1 gap-3 sm:flex-col sm:gap-2.5">
        <Link href={filmHref(winner.film.id, back)} prefetch={false} className="shrink-0">
          <Poster src={winner.film.posterUrl} title={winner.film.title} size="md" className="w-[72px] sm:w-full" rounded="rounded-lg" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <Link
            href={filmHref(winner.film.id, back)}
            prefetch={false}
            className="text-[16px] font-semibold leading-snug hover:underline decoration-label-3 underline-offset-2"
          >
            {winner.film.title}
          </Link>
          {winner.film.originalTitle && winner.film.originalTitle !== winner.film.title && (
            <p className="text-[13px] italic leading-snug text-label-2">{winner.film.originalTitle}</p>
          )}
          {winner.film.directors.length > 0 && (
            <p className="mt-0.5 text-[13px] leading-snug text-label-2">{winner.film.directors.join(', ')}</p>
          )}
          {isLoggedIn && (
            <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 sm:pt-2">
              <WatchedToggle filmId={winner.film.id} title={winner.film.title} initialWatched={winner.status.watched} />
              <PinButton filmId={winner.film.id} initialPinned={winner.status.pinned} />
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
