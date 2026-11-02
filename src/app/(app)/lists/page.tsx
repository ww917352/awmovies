import { getListSummaries } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import ListCard, { ListCards } from '@/components/ListCard';

export const dynamic = 'force-dynamic';

export default async function ListsPage() {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const lists = await getListSummaries(null, user?.id ?? null);

  return (
    <div className="page narrow">
      <h1 className="large-title mb-5">Lists</h1>
      {lists.length === 0 ? (
        <p className="py-12 text-center text-label-2">No lists yet.</p>
      ) : (
        <ListCards>
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </ListCards>
      )}
    </div>
  );
}
