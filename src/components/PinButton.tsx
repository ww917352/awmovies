'use client';

import { useTransition } from 'react';
import PinIcon from './PinIcon';
import { saveStatus, useFilmPinned } from './FilmWatchedContext';

// Pins a film to the Pinned tab's "Now watching". `variant="pill"` shows a
// labelled button (film page); the default is a bare icon (rows, results).
export default function PinButton({
  filmId,
  initialPinned,
  variant = 'icon',
}: {
  filmId: number;
  initialPinned: boolean;
  variant?: 'icon' | 'pill';
}) {
  const [pinned, setPinned] = useFilmPinned(filmId, initialPinned);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !pinned;
    setPinned(next);
    startTransition(async () => {
      if (!(await saveStatus(filmId, { pinned: next }))) setPinned(!next);
    });
  }

  const label = pinned ? 'Unpin' : 'Pin to Now watching';
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={pinned}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
          pinned ? 'bg-tint text-white dark:text-black' : 'bg-fill text-tint hover:bg-fill-2'
        } ${isPending ? 'opacity-60' : ''}`}
      >
        <PinIcon filled={pinned} className="w-4 h-4" />
        {pinned ? 'Pinned' : 'Pin'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={pinned}
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
        pinned ? 'text-tint' : 'text-label-3 hover:text-label-2'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <PinIcon filled={pinned} className="w-5 h-5" />
    </button>
  );
}
