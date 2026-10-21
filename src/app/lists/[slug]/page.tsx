import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListById, getListBySlug, getListFilms, getListSummaries, getPinnedYear } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import QuickNav from '@/components/QuickNav';
import ListCard from '@/components/ListCard';
import ListFilms from '@/components/ListFilms';

export const dynamic = 'force-dynamic';

const DEFAULT_YEAR = 2000;

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const userId = user?.id ?? null;

  const list = await getListBySlug(slug);
  if (!list) notFound();

  const [parent, pinnedYear, sublists, films] = await Promise.all([
    list.parentId === null ? null : getListById(list.parentId),
    getPinnedYear(userId),
    list.kind === 'lists' ? getListSummaries(list.id, userId) : [],
    list.kind === 'films' ? getListFilms(list, userId) : [],
  ]);

  const needsLogin = list.rule === 'owned' && !user;

  return (
    <main className="mx-auto max-w-3xl px-4 pt-20 pb-6">
      <QuickNav
        className="fixed inset-x-0 top-0 z-20"
        targetYear={pinnedYear ?? DEFAULT_YEAR}
        isPinned={pinnedYear !== null}
        yearHref={`/?year=${pinnedYear ?? DEFAULT_YEAR}`}
        user={user ? { username: user.username } : null}
      />

      <Link
        href={parent ? `/lists/${parent.slug}` : '/lists'}
        prefetch={false}
        className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
      >
        &larr; {parent ? parent.title : 'All lists'}
      </Link>

      <h1 className="text-2xl font-bold mt-2">{list.title}</h1>
      {list.description && <p className="text-neutral-600 dark:text-neutral-400 mt-1">{list.description}</p>}
      {list.sourceUrl && (
        <a
          href={list.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-sky-600 dark:text-sky-400 hover:underline mt-1"
        >
          Source
        </a>
      )}

      <div className="mt-4">
        {needsLogin ? (
          <p className="text-neutral-500 text-center py-8">
            <Link href="/login" className="text-sky-600 dark:text-sky-400 hover:underline">
              Log in
            </Link>{' '}
            to see the films you own.
          </p>
        ) : list.kind === 'lists' ? (
          sublists.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">This list is empty.</p>
          ) : (
            sublists.map((sublist) => <ListCard key={sublist.id} list={sublist} />)
          )
        ) : (
          <ListFilms films={films} isLoggedIn={!!user} backHref={`/lists/${list.slug}`} />
        )}
      </div>
    </main>
  );
}
