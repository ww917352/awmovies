'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import PinIcon from './PinIcon';

const pillClass =
  'flex items-center gap-1.5 bg-card/90 backdrop-blur border border-neutral-700 rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg hover:border-neutral-500 whitespace-nowrap';

export default function QuickNav({
  targetYear,
  isPinned,
  yearHref,
  onYearClick,
  className = '',
  user = null,
}: {
  targetYear: number;
  isPinned: boolean;
  yearHref?: string;
  onYearClick?: () => void;
  className?: string;
  user?: { username: string } | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    });
  }

  const yearPillClass = `flex items-center gap-1.5 backdrop-blur border rounded-full px-3 py-1.5 text-sm font-semibold shadow-lg whitespace-nowrap ${
    isPinned
      ? 'bg-amber-950/90 border-amber-700 text-amber-300 hover:border-amber-500'
      : 'bg-card/90 border-neutral-700 hover:border-neutral-500'
  }`;

  return (
    <div className={`flex flex-wrap items-center justify-end gap-2 ${className}`}>
      <Link href="/years" prefetch={false} className={pillClass}>
        Years
      </Link>
      <Link href="/movies" prefetch={false} className={pillClass}>
        Movies
      </Link>
      {user &&
        (onYearClick ? (
          <button onClick={onYearClick} className={yearPillClass}>
            {isPinned && <PinIcon filled className="w-4 h-4" />}
            {targetYear}
          </button>
        ) : (
          <Link href={yearHref ?? `/?year=${targetYear}`} prefetch={false} className={yearPillClass}>
            {isPinned && <PinIcon filled className="w-4 h-4" />}
            {targetYear}
          </Link>
        ))}
      {user ? (
        <button onClick={logout} disabled={isPending} className={`${pillClass} ${isPending ? 'opacity-60' : ''}`}>
          {user.username} &middot; Log out
        </button>
      ) : (
        <Link href="/login" prefetch={false} className={pillClass}>
          Log in
        </Link>
      )}
    </div>
  );
}
