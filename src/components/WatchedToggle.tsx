'use client';

import { useFilmWatched, useLockWatched, useOfferUnpin, useStatusSaver } from './FilmWatchedContext';
import { CheckIcon } from './ui/icons';

// A round check button, like Reminders. Marking a pinned film watched offers
// to unpin it (see FilmWatchedProvider).
export default function WatchedToggle({
  filmId,
  title,
  initialWatched,
}: {
  filmId: number;
  title: string;
  initialWatched: boolean;
}) {
  const [watched, setWatched] = useFilmWatched(filmId, initialWatched);
  const offerUnpin = useOfferUnpin();
  const [save, isPending] = useStatusSaver(filmId, initialWatched);
  // With the lock setting on, a watched film can't be unticked here — only
  // from its film page.
  const locked = useLockWatched() && watched;

  function toggle() {
    if (locked) return;
    const next = !watched;
    save(next, { watched: next }, setWatched).then((ok) => ok && next && offerUnpin(filmId, title));
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={watched}
      aria-label={locked ? 'Watched — change it on the film page' : `Watched: ${title}`}
      title={locked ? 'Watched — change it on the film page' : 'Watched'}
      onClick={toggle}
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors ${
        watched ? 'bg-ok-bright text-white' : 'ring-[1.5px] ring-inset ring-label-3 text-transparent hover:ring-label-2'
      } ${locked ? 'cursor-default' : ''} ${isPending ? 'opacity-60' : ''}`}
    >
      <CheckIcon className="w-[60%] h-[60%]" />
    </button>
  );
}
