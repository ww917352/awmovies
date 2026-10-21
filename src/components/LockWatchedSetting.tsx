'use client';

import { useState, useTransition } from 'react';

export default function LockWatchedSetting({ initialLockWatched }: { initialLockWatched: boolean }) {
  const [lockWatched, setLockWatched] = useState(initialLockWatched);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const previous = lockWatched;
    const next = !lockWatched;
    setLockWatched(next);
    startTransition(async () => {
      const res = await fetch('/api/settings/lock-watched', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockWatched: next }),
      }).catch(() => null);
      if (!res || !res.ok) setLockWatched(previous);
    });
  }

  return (
    <div>
      <label className={`flex items-center gap-2 text-sm cursor-pointer select-none ${isPending ? 'opacity-60' : ''}`}>
        <input type="checkbox" checked={lockWatched} onChange={toggle} className="accent-emerald-500" />
        Keep watched films watched
      </label>
      <p className="text-sm text-neutral-500 mt-1 ml-6">
        Once a film is marked watched, it can&rsquo;t be unticked from the year, movie or list pages — only from the
        film&rsquo;s own page.
      </p>
    </div>
  );
}
