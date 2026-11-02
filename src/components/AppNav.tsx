'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import Logo from './Logo';
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

// The nav, with a film page shown under whichever tab it was opened from
// (its ?back= link). Reading the query string needs a Suspense boundary;
// the layout's fallback is <AppNav>, which doesn't.
export default function AppNavWithBack({ user }: { user: { username: string } | null }) {
  const back = useSearchParams().get('back');
  return <AppNav user={user} back={back} />;
}

// One nav rendered three ways by globals.css: sidebar, top bar, tab bar.
export function AppNav({ user, back = null }: { user: { username: string } | null; back?: string | null }) {
  const pathname = usePathname();
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
              <span className="tab-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
