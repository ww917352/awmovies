import { getAllWins, getAllAwards, getPinnedYear } from '@/db/queries';
import { getCurrentUser } from '@/lib/auth';
import MovieList from '@/components/MovieList';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const user = await getCurrentUser();
  const [wins, awards, pinnedYear] = await Promise.all([
    getAllWins(user?.id ?? null),
    getAllAwards(),
    getPinnedYear(user?.id ?? null),
  ]);

  return (
    <MovieList
      wins={wins}
      awards={awards}
      pinnedYear={pinnedYear}
      user={user ? { username: user.username } : null}
    />
  );
}
