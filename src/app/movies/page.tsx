import { getAllWins, getAllAwards, getListOnlyFilms, getPinnedYear } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import MovieList from '@/components/MovieList';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const [wins, listOnlyFilms, awards, pinnedYear] = await Promise.all([
    getAllWins(user?.id ?? null),
    getListOnlyFilms(user?.id ?? null),
    getAllAwards(),
    getPinnedYear(user?.id ?? null),
  ]);

  return (
    <MovieList
      wins={wins}
      listOnlyFilms={listOnlyFilms}
      awards={awards}
      pinnedYear={pinnedYear}
      user={user ? { username: user.username } : null}
    />
  );
}
