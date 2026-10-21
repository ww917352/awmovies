import { getListSummaries, getPinnedYear } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import QuickNav from '@/components/QuickNav';
import ListCard from '@/components/ListCard';

export const dynamic = 'force-dynamic';

const DEFAULT_YEAR = 2000;

export default async function ListsPage() {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const [lists, pinnedYear] = await Promise.all([
    getListSummaries(null, user?.id ?? null),
    getPinnedYear(user?.id ?? null),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 pt-20 pb-6">
      <QuickNav
        className="fixed inset-x-0 top-0 z-20"
        targetYear={pinnedYear ?? DEFAULT_YEAR}
        isPinned={pinnedYear !== null}
        yearHref={`/?year=${pinnedYear ?? DEFAULT_YEAR}`}
        user={user ? { username: user.username } : null}
      />

      <h1 className="text-2xl font-bold mb-4">Lists</h1>

      {lists.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No lists yet.</p>
      ) : (
        lists.map((list) => <ListCard key={list.id} list={list} />)
      )}
    </main>
  );
}
