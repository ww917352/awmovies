'use client';

import { useState } from 'react';
import { useWatchedMap } from './FilmWatchedContext';

// The "Unwatched only" checkbox. Ticking it reports the films watched at that
// moment — including ones marked watched since the page loaded — so the list
// can hide them; a film marked watched while it's ticked stays put rather
// than vanishing under the cursor. Must render inside a FilmWatchedProvider.
export default function UnwatchedOnlyToggle({ onChange }: { onChange: (hiddenIds: Set<number> | null) => void }) {
  const watchedMap = useWatchedMap();
  const [checked, setChecked] = useState(false);

  return (
    <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          onChange(
            e.target.checked
              ? new Set(Object.entries(watchedMap).filter(([, watched]) => watched).map(([id]) => Number(id)))
              : null
          );
        }}
        className="accent-emerald-500"
      />
      Unwatched only
    </label>
  );
}
