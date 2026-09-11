'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import PinIcon from './PinIcon';
import { capitalizeWords } from '@/lib/format';

function linkClass(active: boolean) {
  return `text-sm font-semibold pb-0.5 border-b-2 whitespace-nowrap ${
    active
      ? 'text-neutral-900 dark:text-neutral-100 border-neutral-900 dark:border-neutral-100'
      : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
  }`;
}

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  const yearClass = `flex items-center gap-1 text-sm font-semibold whitespace-nowrap ${
    isPinned
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
  }`;

  return (
    <nav
      className={`flex items-center gap-5 h-12 px-4 border-b border-neutral-200 dark:border-neutral-800 bg-surface/90 backdrop-blur ${className}`}
    >
      <Link href="/years" prefetch={false} className={linkClass(pathname === '/years')}>
        Years
      </Link>
      <Link href="/movies" prefetch={false} className={linkClass(pathname === '/movies')}>
        Movies
      </Link>
      <div className="ml-auto flex items-center gap-5">
        {user &&
          (onYearClick ? (
            <button onClick={onYearClick} className={yearClass}>
              {isPinned && <PinIcon filled className="w-3.5 h-3.5" />}
              {targetYear}
            </button>
          ) : (
            <Link href={yearHref ?? `/?year=${targetYear}`} prefetch={false} className={yearClass}>
              {isPinned && <PinIcon filled className="w-3.5 h-3.5" />}
              {targetYear}
            </Link>
          ))}
        {user ? (
          <Link
            href={`/account?back=${encodeURIComponent(currentPath)}`}
            prefetch={false}
            className={linkClass(pathname === '/account')}
          >
            {capitalizeWords(user.username)}
          </Link>
        ) : (
          <Link href="/login" prefetch={false} className={linkClass(pathname === '/login')}>
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
