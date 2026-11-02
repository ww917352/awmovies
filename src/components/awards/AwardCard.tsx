import Link from 'next/link';
import Poster from '../Poster';
import PinButton from '../PinButton';
import WatchedToggle from '../WatchedToggle';
import { filmHref } from '@/lib/format';
import type { AwardCardData } from './AwardYear';

// One award in a year: its name, then the winning film. Poster beside the
// text on phones, above it on wider screens. A shared prize puts its winners
// side by side at half width, so the card stays the height of the others.
export default function AwardCard({ card, year, isLoggedIn }: { card: AwardCardData; year: number; isLoggedIn: boolean }) {
  const back = `/awards/${year}`;
  const shared = card.winners.length > 1;
  return (
    <section className="flex flex-col rounded-2xl bg-card p-3 shadow-card sm:p-3.5">
      <header className="mb-2 px-0.5 sm:mb-2.5">
        <p className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-label-2">
          {card.org}
          {shared && <span className="rounded-full bg-tint-soft px-1.5 py-px text-[10px] text-tint">Shared</span>}
        </p>
        <h2 className="headline leading-tight">{card.prize}</h2>
      </header>

      {card.winners.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-sep px-3 py-4 text-center text-[13px] text-label-3 sm:aspect-[2/3] sm:flex-none sm:py-0">
          Not awarded this year
        </div>
      ) : (
        <div className={`flex flex-1 flex-col gap-3 ${shared ? 'sm:grid sm:grid-cols-2 sm:gap-2' : ''}`}>
          {card.winners.map((w) => (
            <article key={w.film.id} className="flex flex-1 gap-3 sm:flex-col sm:gap-2">
              <Link href={filmHref(w.film.id, back)} prefetch={false} className="shrink-0">
                <Poster
                  src={w.film.posterUrl}
                  title={w.film.title}
                  className={`${shared ? 'w-14' : 'w-[72px]'} sm:w-full`}
                  rounded={shared ? 'rounded-md' : 'rounded-lg'}
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={filmHref(w.film.id, back)}
                  prefetch={false}
                  className={`font-semibold leading-snug hover:underline decoration-label-3 underline-offset-2 ${
                    shared ? 'text-[15px] sm:line-clamp-2 sm:text-[13px]' : 'text-[16px]'
                  }`}
                >
                  {w.film.title}
                </Link>
                {w.film.originalTitle && w.film.originalTitle !== w.film.title && (
                  <p className={`text-[13px] italic leading-snug text-label-2 ${shared ? 'sm:hidden' : ''}`}>
                    {w.film.originalTitle}
                  </p>
                )}
                {w.film.directors.length > 0 && (
                  <p className={`mt-0.5 leading-snug text-label-2 ${shared ? 'truncate text-[13px] sm:text-[11px]' : 'text-[13px]'}`}>
                    {w.film.directors.join(', ')}
                  </p>
                )}
                {isLoggedIn && (
                  <div className="mt-auto flex items-center justify-between gap-1 pt-1.5 sm:pt-2">
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
