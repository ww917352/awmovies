import { getAllWins, getAllAwards, getListMemberships, getListOnlyFilms, getUserSettings } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import MovieList from '@/components/MovieList';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const [wins, listOnlyFilms, listMemberships, awards, { pinnedYear, lockWatched }] = await Promise.all([
    getAllWins(user?.id ?? null),
    getListOnlyFilms(user?.id ?? null),
    getListMemberships(),
    getAllAwards(),
    getUserSettings(user?.id ?? null),
  ]);

  return (
    <MovieList
      wins={wins}
      listOnlyFilms={listOnlyFilms}
      listMemberships={listMemberships}
      awards={awards}
      pinnedYear={pinnedYear}
      user={user ? { username: user.username } : null}
      lockWatched={lockWatched}
    />
  );
}
