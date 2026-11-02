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
    <label className={`flex cursor-pointer items-center justify-between gap-4 select-none ${isPending ? 'opacity-60' : ''}`}>
      <span className="text-[17px]">Keep watched films watched</span>
      <input type="checkbox" checked={lockWatched} onChange={toggle} className="peer sr-only" role="switch" />
      <span
        aria-hidden
        className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill-2 transition-colors peer-checked:bg-ok-bright peer-focus-visible:ring-2 peer-focus-visible:ring-tint after:absolute after:left-[2px] after:top-[2px] after:h-[27px] after:w-[27px] after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
