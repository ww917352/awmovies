import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDirectorById, getListById, getListBySlug, getListFilms, getListSummaries, getUserSettings } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import ListCard, { ListCards } from '@/components/ListCard';
import { ChevronLeft } from '@/components/ui/icons';
import ListFilms from '@/components/ListFilms';
import DirectorHeader from '@/components/DirectorHeader';

export const dynamic = 'force-dynamic';

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const userId = user?.id ?? null;

  const list = await getListBySlug(slug);
  if (!list) notFound();

  const [parent, director, { lockWatched }, sublists, films] = await Promise.all([
    list.parentId === null ? null : getListById(list.parentId),
    list.directorId === null ? null : getDirectorById(list.directorId),
    getUserSettings(userId),
    list.kind === 'lists' ? getListSummaries(list.id, userId) : [],
    list.kind === 'films' ? getListFilms(list, userId) : [],
  ]);

  const needsLogin = list.rule === 'owned' && !user;

  return (
    <div className="page narrow">
      <Link
        href={parent ? `/lists/${parent.slug}` : '/lists'}
        prefetch={false}
        className="mb-3 inline-flex items-center gap-0.5 text-[17px] text-tint"
      >
        <ChevronLeft className="w-5 h-5 -ml-1" />
        {parent ? parent.title : 'Lists'}
      </Link>

      <div className="mb-5">
        {director ? <DirectorHeader director={director} /> : <h1 className="large-title">{list.title}</h1>}
        {list.description && <p className="mt-2 max-w-prose text-label-2">{list.description}</p>}
        {list.sourceUrl && (
          <a href={list.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[15px] text-tint hover:underline">
            Source
          </a>
        )}
      </div>

      {needsLogin ? (
        <p className="py-12 text-center text-label-2">
          <Link href="/login" className="text-tint hover:underline">
            Log in
          </Link>{' '}
          to see the films you own.
        </p>
      ) : list.kind === 'lists' ? (
        sublists.length === 0 ? (
          <p className="py-12 text-center text-label-2">This list is empty.</p>
        ) : (
          <ListCards>
            {sublists.map((sublist) => (
              <ListCard key={sublist.id} list={sublist} />
            ))}
          </ListCards>
        )
      ) : (
        <ListFilms
          films={films}
          isLoggedIn={!!user}
          lockWatched={lockWatched}
          backHref={`/lists/${list.slug}`}
          showYear={!!director}
          progressSection={director ? 'Feature films' : undefined}
        />
      )}
    </div>
  );
}
