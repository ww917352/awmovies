import Link from 'next/link';
import type { ListSummary } from '@/db/queries';

function countLabel(list: ListSummary): string {
  if (list.itemCount === null) return 'Log in to see your films';
  const noun = list.kind === 'lists' ? 'list' : 'film';
  return `${list.itemCount} ${noun}${list.itemCount === 1 ? '' : 's'}`;
}

export default function ListCard({ list }: { list: ListSummary }) {
  return (
    <Link
      href={`/lists/${list.slug}`}
      prefetch={false}
      className="block rounded-lg border border-neutral-200 dark:border-neutral-800 bg-card/40 hover:border-neutral-400 dark:hover:border-neutral-600 px-4 py-3 mb-2.5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-lg font-semibold">{list.title}</span>
        <span className="text-sm text-neutral-500 whitespace-nowrap">{countLabel(list)}</span>
      </div>
      {list.description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{list.description}</p>
      )}
    </Link>
  );
}
