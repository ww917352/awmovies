'use client';

import { useState } from 'react';
import { useWatchedMap } from './FilmWatchedContext';
import Chip from './ui/Chip';

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
