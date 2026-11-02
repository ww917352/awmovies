import Link from 'next/link';
import type { ListSummary } from '@/db/queries';
import { lifeYears } from './DirectorHeader';
import { ChevronRight, ListsIcon } from './ui/icons';
import { isTmdbImage, tmdbImage } from './Poster';

function countLabel(list: ListSummary): string {
  if (list.itemCount === null) return 'Log in to see';
  const noun = list.kind === 'lists' ? 'list' : 'film';
  return `${list.itemCount} ${noun}${list.itemCount === 1 ? '' : 's'}`;
}

// One list in a grouped card of lists (wrap them in <ListCards>).
export default function ListCard({ list }: { list: ListSummary }) {
  const { director } = list;
  return (
    <Link href={`/lists/${list.slug}`} prefetch={false} className="flex items-center gap-3 px-4 py-3 hover:bg-card-2">
      {director?.photoUrl && isTmdbImage(director.photoUrl) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tmdbImage(director.photoUrl, 'w185')}
          alt=""
          referrerPolicy="no-referrer"
          className="h-12 w-12 shrink-0 rounded-full object-cover object-top"
        />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-tint-soft text-tint">
          <ListsIcon className="w-6 h-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="headline block">{list.title}</span>
        {director && <span className="block text-[13px] text-label-2">{lifeYears(director)}</span>}
        {list.description && <span className="line-clamp-2 block text-[13px] text-label-2">{list.description}</span>}
      </span>
      <span className="shrink-0 text-[13px] text-label-2 tabular-nums">{countLabel(list)}</span>
      <ChevronRight className="w-4 h-4 shrink-0 text-label-3" />
    </Link>
  );
}

export function ListCards({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl bg-card divide-y divide-sep">{children}</div>;
}
