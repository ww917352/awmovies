'use client';

import { useTransition } from 'react';
import { saveStatus, useFilmWatched, useLockWatched, useOfferUnpin } from './FilmWatchedContext';
import { CheckIcon } from './ui/icons';

// A round check button, like Reminders. Marking a pinned film watched offers
// to unpin it (see FilmWatchedProvider).
export default function WatchedToggle({
  filmId,
  title,
  initialWatched,
  size = 'md',
}: {
  filmId: number;
  title: string;
  initialWatched: boolean;
  size?: 'md' | 'lg';
}) {
  const [watched, setWatched] = useFilmWatched(filmId, initialWatched);
  const offerUnpin = useOfferUnpin();
  const [isPending, startTransition] = useTransition();
  // With the lock setting on, a watched film can't be unticked here — only
  // from its film page.
  const locked = useLockWatched() && watched;

  function toggle() {
    if (locked) return;
    const previous = watched;
    const next = !watched;
    setWatched(next);
    startTransition(async () => {
      // Roll back if the write didn't land (e.g. the session expired).
      if (!(await saveStatus(filmId, { watched: next }))) setWatched(previous);
      else if (next) offerUnpin(filmId, title);
    });
  }

  const dim = size === 'lg' ? 'w-8 h-8' : 'w-7 h-7';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={watched}
      aria-label={locked ? 'Watched — change it on the film page' : `Watched: ${title}`}
      title={locked ? 'Watched — change it on the film page' : 'Watched'}
      onClick={toggle}
      className={`grid shrink-0 place-items-center rounded-full transition-colors ${dim} ${
        watched ? 'bg-ok-bright text-white' : 'ring-[1.5px] ring-inset ring-label-3 text-transparent hover:ring-label-2'
      } ${locked ? 'cursor-default' : ''} ${isPending ? 'opacity-60' : ''}`}
    >
      <CheckIcon className="w-[60%] h-[60%]" />
    </button>
  );
}
