import { db } from './client';
import { awards, awardWins, films, filmStatus, appSettings } from './schema';
import { eq, min, max } from 'drizzle-orm';

export type FilmWithWins = {
  id: number;
  title: string;
  originalTitle: string | null;
  releaseYear: number;
  directors: string[];
  studios: string[];
  mainCast: string[];
  wikiUrl: string | null;
  letterboxdUrl: string | null;
  letterboxdUnverified: boolean;
  appleTvUrl: string | null;
  posterUrl: string | null;
  plotSummary: string | null;
  status: {
    watched: boolean;
    watchedDate: string | null;
    ownedFormats: string[];
    digitalQuality: string | null;
    notes: string | null;
  };
  wins: {
    awardSlug: string;
    awardName: string;
    organization: string;
    year: number;
    editionLabel: string | null;
  }[];
};

export async function getAllAwards() {
  return db.select().from(awards);
}

export async function getAllFilms(): Promise<FilmWithWins[]> {
  const rows = await db
    .select({
      filmId: films.id,
      title: films.title,
      originalTitle: films.originalTitle,
      releaseYear: films.releaseYear,
      directors: films.directors,
      studios: films.studios,
      mainCast: films.mainCast,
      wikiUrl: films.wikiUrl,
      letterboxdUrl: films.letterboxdUrl,
      letterboxdUnverified: films.letterboxdUnverified,
      appleTvUrl: films.appleTvUrl,
      posterUrl: films.posterUrl,
      plotSummary: films.plotSummary,
      watched: filmStatus.watched,
      watchedDate: filmStatus.watchedDate,
      ownedFormats: filmStatus.ownedFormats,
      digitalQuality: filmStatus.digitalQuality,
      notes: filmStatus.notes,
      awardSlug: awards.slug,
      awardName: awards.name,
      organization: awards.organization,
      winYear: awardWins.year,
      editionLabel: awardWins.editionLabel,
    })
    .from(films)
    .leftJoin(filmStatus, eq(filmStatus.filmId, films.id))
    .leftJoin(awardWins, eq(awardWins.filmId, films.id))
    .leftJoin(awards, eq(awards.id, awardWins.awardId));

  const byFilm = new Map<number, FilmWithWins>();

  for (const row of rows) {
    let film = byFilm.get(row.filmId);
    if (!film) {
      film = {
        id: row.filmId,
        title: row.title,
        originalTitle: row.originalTitle,
        releaseYear: row.releaseYear,
        directors: row.directors,
        studios: row.studios,
        mainCast: row.mainCast,
        wikiUrl: row.wikiUrl,
        letterboxdUrl: row.letterboxdUrl,
        letterboxdUnverified: row.letterboxdUnverified,
        appleTvUrl: row.appleTvUrl,
        posterUrl: row.posterUrl,
        plotSummary: row.plotSummary,
        status: {
          watched: row.watched ?? false,
          watchedDate: row.watchedDate,
          ownedFormats: row.ownedFormats ?? [],
          digitalQuality: row.digitalQuality,
          notes: row.notes,
        },
        wins: [],
      };
      byFilm.set(row.filmId, film);
    }
    if (row.awardSlug && row.winYear !== null) {
      film.wins.push({
        awardSlug: row.awardSlug,
        awardName: row.awardName!,
        organization: row.organization!,
        year: row.winYear,
        editionLabel: row.editionLabel,
      });
    }
  }

  return Array.from(byFilm.values()).sort((a, b) => {
    const aYear = Math.max(...a.wins.map((w) => w.year));
    const bYear = Math.max(...b.wins.map((w) => w.year));
    return bYear - aYear;
  });
}

export async function getFilmById(id: number): Promise<FilmWithWins | null> {
  const all = await getAllFilms();
  return all.find((f) => f.id === id) ?? null;
}

export type WinEntry = {
  year: number;
  editionLabel: string | null;
  awardSlug: string;
  awardName: string;
  organization: string;
  film: {
    id: number;
    title: string;
    originalTitle: string | null;
    releaseYear: number;
    directors: string[];
    studios: string[];
    mainCast: string[];
    wikiUrl: string | null;
    letterboxdUrl: string | null;
    letterboxdUnverified: boolean;
    appleTvUrl: string | null;
  };
  status: {
    watched: boolean;
    ownedFormats: string[];
    digitalQuality: string | null;
  };
};

export async function getAllWins(): Promise<WinEntry[]> {
  const rows = await db
    .select({
      year: awardWins.year,
      editionLabel: awardWins.editionLabel,
      awardSlug: awards.slug,
      awardName: awards.name,
      organization: awards.organization,
      filmId: films.id,
      title: films.title,
      originalTitle: films.originalTitle,
      releaseYear: films.releaseYear,
      directors: films.directors,
      studios: films.studios,
      mainCast: films.mainCast,
      wikiUrl: films.wikiUrl,
      letterboxdUrl: films.letterboxdUrl,
      letterboxdUnverified: films.letterboxdUnverified,
      appleTvUrl: films.appleTvUrl,
      watched: filmStatus.watched,
      ownedFormats: filmStatus.ownedFormats,
      digitalQuality: filmStatus.digitalQuality,
    })
    .from(awardWins)
    .innerJoin(awards, eq(awards.id, awardWins.awardId))
    .innerJoin(films, eq(films.id, awardWins.filmId))
    .leftJoin(filmStatus, eq(filmStatus.filmId, films.id))
    .orderBy(awardWins.year, awards.slug, films.title);

  return rows.map((row) => ({
    year: row.year,
    editionLabel: row.editionLabel,
    awardSlug: row.awardSlug,
    awardName: row.awardName,
    organization: row.organization,
    film: {
      id: row.filmId,
      title: row.title,
      originalTitle: row.originalTitle,
      releaseYear: row.releaseYear,
      directors: row.directors,
      studios: row.studios,
      mainCast: row.mainCast,
      wikiUrl: row.wikiUrl,
      letterboxdUrl: row.letterboxdUrl,
      letterboxdUnverified: row.letterboxdUnverified,
      appleTvUrl: row.appleTvUrl,
    },
    status: {
      watched: row.watched ?? false,
      ownedFormats: row.ownedFormats ?? [],
      digitalQuality: row.digitalQuality,
    },
  }));
}

export async function getYearRange(): Promise<{ minYear: number; maxYear: number }> {
  const [row] = await db.select({ minYear: min(awardWins.year), maxYear: max(awardWins.year) }).from(awardWins);
  const currentYear = new Date().getFullYear();
  return { minYear: row?.minYear ?? 1929, maxYear: row?.maxYear ?? currentYear };
}

export async function getPinnedYear(): Promise<number | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.id, 1));
  return row?.pinnedYear ?? null;
}

export async function setPinnedYear(year: number | null): Promise<void> {
  await db
    .insert(appSettings)
    .values({ id: 1, pinnedYear: year })
    .onConflictDoUpdate({ target: appSettings.id, set: { pinnedYear: year } });
}
