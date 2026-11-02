import { getAllAwards, getAllWins, getListMemberships, getListOnlyFilms, getUserSettings } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { awardInfo, orderAwards } from '@/lib/format';
import MovieList, { type MovieFilm } from '@/components/MovieList';

export const dynamic = 'force-dynamic';

// Only what the rows show and the search matches on — the page lists every
// award win, so dropping links and posters keeps its payload down.
function toMovieFilm(film: MovieFilm): MovieFilm {
  const { id, title, originalTitle, releaseYear, directors, mainCast, studios } = film;
  return { id, title, originalTitle, releaseYear, directors, mainCast, studios };
}

export default async function MoviesPage() {
  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const [wins, listOnlyFilms, listMemberships, dbAwards, { lockWatched }] = await Promise.all([
    getAllWins(user?.id ?? null),
    getListOnlyFilms(user?.id ?? null),
    getListMemberships(),
    getAllAwards(),
    getUserSettings(user?.id ?? null),
  ]);

  return (
    <MovieList
      wins={wins.map(({ year, awardSlug, awardName, film, status }) => ({
        year,
        awardSlug,
        awardName,
        film: toMovieFilm(film),
        status,
      }))}
      listOnlyFilms={listOnlyFilms.map(({ film, status }) => ({ film: toMovieFilm(film), status }))}
      listMemberships={listMemberships}
      awards={orderAwards(dbAwards).map((a) => ({ slug: a.slug, chip: awardInfo(a).chip }))}
      user={user ? { username: user.username } : null}
      lockWatched={lockWatched}
    />
  );
}
