'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Logo from './Logo';
import TmdbAttribution from './TmdbAttribution';
import { FilmIcon, ListsIcon, PersonIcon, PinTabIcon, TrophyIcon } from './ui/icons';
import { capitalizeWords } from '@/lib/format';

type Tab = { href: string; label: string; Icon: typeof FilmIcon; match: (path: string) => boolean };

function tabs(user: { username: string } | null): Tab[] {
  return [
    { href: '/', label: 'Pinned', Icon: PinTabIcon, match: (p) => p === '/' },
    { href: '/awards', label: 'Awards', Icon: TrophyIcon, match: (p) => p.startsWith('/awards') },
    { href: '/lists', label: 'Lists', Icon: ListsIcon, match: (p) => p.startsWith('/lists') },
    { href: '/movies', label: 'Movies', Icon: FilmIcon, match: (p) => p.startsWith('/movies') },
    user
      ? { href: '/account', label: capitalizeWords(user.username), Icon: PersonIcon, match: (p) => p.startsWith('/account') }
      : { href: '/login', label: 'Log in', Icon: PersonIcon, match: (p) => p === '/login' },
  ];
}

// One nav rendered three ways by globals.css: sidebar, top bar, tab bar.
// A film page belongs to whichever tab it was opened from (its ?back= link).
export default function AppNav({ user }: { user: { username: string } | null }) {
  const pathname = usePathname();
  const back = useSearchParams().get('back');
  const activePath = pathname.startsWith('/films/') && back?.startsWith('/') ? back.split(/[?#]/)[0] : pathname;

  return (
    <nav className="app-nav" aria-label="Main">
      <Link href="/" className="brand" prefetch={false}>
        <Logo idPrefix="nav-logo" />
        <span>Palmarès</span>
      </Link>
      <div className="tabs">
        {tabs(user).map(({ href, label, Icon, match }) => {
          const active = match(activePath);
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`tab ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      <TmdbAttribution className="nav-footer mt-auto px-2" />
    </nav>
  );
}
