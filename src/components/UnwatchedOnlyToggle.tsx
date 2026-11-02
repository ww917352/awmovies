'use client';

import { useState } from 'react';
import { useWatchedMap } from './FilmWatchedContext';

// The "Unwatched" filter chip. Turning it on reports the films watched at
// that moment — including ones marked watched since the page loaded — so the
// list can hide them; a film marked watched while it's on stays put rather
// than vanishing under the cursor. Must render inside a FilmWatchedProvider.
export default function UnwatchedOnlyToggle({ onChange }: { onChange: (hiddenIds: Set<number> | null) => void }) {
  const watchedMap = useWatchedMap();
  const [on, setOn] = useState(false);

  return (
    <Chip
      on={on}
      onClick={() => {
        setOn(!on);
        onChange(
          !on ? new Set(Object.entries(watchedMap).filter(([, watched]) => watched).map(([id]) => Number(id))) : null
        );
      }}
    >
      Unwatched
    </Chip>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${
        on ? 'bg-label text-bg' : 'bg-fill text-label hover:bg-fill-2'
      }`}
    >
      {children}
    </button>
  );
}
