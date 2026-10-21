import type { ListMembership } from '@/db/queries';

// A film's place in a list as shown in a FilmRow label, e.g. "The 21st
// Century's 100 Greatest Films · No. 10".
export default function ListLabel({ list }: { list: ListMembership }) {
  return <span>{list.rank === null ? list.title : `${list.title} · No. ${list.rank}`}</span>;
}
