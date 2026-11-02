import Link from 'next/link';
import Poster from '../Poster';
import PinButton from '../PinButton';
import WatchedToggle from '../WatchedToggle';
import { filmHref } from '@/lib/format';
import type { AwardCardData } from './AwardYear';

// One award in a year: its name, then the winning film (rarely several, when
// the prize was shared). Poster beside the text on phones, above it on wider
// screens.
export default function AwardCard({ card, year, isLoggedIn }: { card: AwardCardData; year: number; isLoggedIn: boolean }) {
  const back = `/awards/${year}`;
  return (
    <section className="flex flex-col rounded-2xl bg-card p-3 shadow-card sm:p-3.5">
      <header className="mb-2 px-0.5 sm:mb-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-label-2">{card.org}</p>
        <h2 className="headline leading-tight">{card.prize}</h2>
      </header>

      {card.winners.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-sep px-3 py-4 text-center text-[13px] text-label-3 sm:aspect-[2/3] sm:py-0">
          Not awarded this year
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {card.winners.map((w) => (
            <article key={w.film.id} className="flex gap-3 sm:flex-col sm:gap-2.5">
              <Link href={filmHref(w.film.id, back)} prefetch={false} className="shrink-0">
                <Poster
                  src={w.film.posterUrl}
                  title={w.film.title}
                  className="w-[72px] sm:w-full"
                  rounded="rounded-lg"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={filmHref(w.film.id, back)}
                  prefetch={false}
                  className="text-[16px] font-semibold leading-snug hover:underline decoration-label-3 underline-offset-2"
                >
                  {w.film.title}
                </Link>
                {w.film.originalTitle && w.film.originalTitle !== w.film.title && (
                  <p className="text-[13px] italic leading-snug text-label-2">{w.film.originalTitle}</p>
                )}
                {w.film.directors.length > 0 && (
                  <p className="mt-0.5 text-[13px] leading-snug text-label-2">{w.film.directors.join(', ')}</p>
                )}
                {isLoggedIn && (
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1.5 sm:pt-2">
                    <WatchedToggle filmId={w.film.id} title={w.film.title} initialWatched={w.status.watched} />
                    <PinButton filmId={w.film.id} initialPinned={w.status.pinned} />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
