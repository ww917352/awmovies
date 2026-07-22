import { getAllWins, getAllAwards, getPinnedYear } from '@/db/queries';
import MovieList from '@/components/MovieList';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const [wins, awards, pinnedYear] = await Promise.all([getAllWins(), getAllAwards(), getPinnedYear()]);

  return <MovieList wins={wins} awards={awards} pinnedYear={pinnedYear} />;
}
