import { db } from './client';
import { awards, awardWins, films, filmStatus, lists, userSettings } from './schema';
import { and, asc, count, eq, gt, inArray, isNull, min, max, sql } from 'drizzle-orm';

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

// Shared by getAllFilms, getFilmById and getListFilms — `filmId` narrows to
// one film via a real SQL WHERE instead of loading every film and filtering
// in JS (getFilmById used to call getAllFilms() and .find(), joining the
// entire catalogue to return a single row); `ownedOnly` likewise keeps only
// films the user owns in some format.
async function selectFilmsWithWins(
  userId: number | null,
  { filmId, ownedOnly = false }: { filmId?: number; ownedOnly?: boolean } = {}
): Promise<FilmWithWins[]> {
  const statusJoinCondition =
    userId === null ? sql`false` : and(eq(filmStatus.filmId, films.id), eq(filmStatus.userId, userId));

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
    .leftJoin(filmStatus, statusJoinCondition)
    .leftJoin(awardWins, eq(awardWins.filmId, films.id))
    .leftJoin(awards, eq(awards.id, awardWins.awardId))
    .where(
      and(
        filmId === undefined ? undefined : eq(films.id, filmId),
        ownedOnly ? gt(sql`cardinality(${filmStatus.ownedFormats})`, 0) : undefined
      )
    );

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

  // Comparing with relational operators rather than subtracting handles
  // -Infinity correctly (Math.max() over an empty wins array is -Infinity,
  // and -Infinity - -Infinity is NaN — two films with no wins would
  // otherwise produce a NaN comparator result and undefined ordering).
  // Every seeded film currently has at least one win, but this stays
  // correct if that ever isn't true.
  return Array.from(byFilm.values()).sort((a, b) => {
    const aYear = a.wins.length ? Math.max(...a.wins.map((w) => w.year)) : -Infinity;
    const bYear = b.wins.length ? Math.max(...b.wins.map((w) => w.year)) : -Infinity;
    if (aYear > bYear) return -1;
    if (aYear < bYear) return 1;
    return 0;
  });
}

// `userId` scopes watched/owned status to that user; pass `null` for
// logged-out visitors, who see blank status regardless of what's in the DB.
export async function getAllFilms(userId: number | null): Promise<FilmWithWins[]> {
  return selectFilmsWithWins(userId);
}

export async function getFilmById(id: number, userId: number | null): Promise<FilmWithWins | null> {
  const [film] = await selectFilmsWithWins(userId, { filmId: id });
  return film ?? null;
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

export async function getAllWins(userId: number | null): Promise<WinEntry[]> {
  const statusJoinCondition =
    userId === null ? sql`false` : and(eq(filmStatus.filmId, films.id), eq(filmStatus.userId, userId));

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
    .leftJoin(filmStatus, statusJoinCondition)
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

// Logged-out visitors (userId === null) never have a pin — skip the query.
export async function getPinnedYear(userId: number | null): Promise<number | null> {
  if (userId === null) return null;
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
  return row?.pinnedYear ?? null;
}

export async function setPinnedYear(userId: number, year: number | null): Promise<void> {
  await db
    .insert(userSettings)
    .values({ userId, pinnedYear: year })
    .onConflictDoUpdate({ target: userSettings.userId, set: { pinnedYear: year } });
}

export type List = typeof lists.$inferSelect;

// `itemCount` is the number of sublists for a 'lists' list, or of films for a
// films list — null when that depends on a logged-out viewer (an 'owned'
// list has no films until someone logs in).
export type ListSummary = List & { itemCount: number | null };

export async function getListBySlug(slug: string): Promise<List | null> {
  const [list] = await db.select().from(lists).where(eq(lists.slug, slug));
  return list ?? null;
}

export async function getListById(id: number): Promise<List | null> {
  const [list] = await db.select().from(lists).where(eq(lists.id, id));
  return list ?? null;
}

// The lists directly under `parentId` (null for the top level), in display order.
export async function getListSummaries(parentId: number | null, userId: number | null): Promise<ListSummary[]> {
  const rows = await db
    .select()
    .from(lists)
    .where(parentId === null ? isNull(lists.parentId) : eq(lists.parentId, parentId))
    .orderBy(asc(lists.position), asc(lists.title));
  if (rows.length === 0) return [];

  const parentIds = rows.filter((l) => l.kind === 'lists').map((l) => l.id);
  const childCounts = new Map<number, number>();
  if (parentIds.length) {
    const counts = await db
      .select({ parentId: lists.parentId, n: count() })
      .from(lists)
      .where(inArray(lists.parentId, parentIds))
      .groupBy(lists.parentId);
    for (const c of counts) childCounts.set(c.parentId!, c.n);
  }

  let ownedCount: number | null = null;
  if (userId !== null && rows.some((l) => l.rule === 'owned')) {
    const [row] = await db
      .select({ n: count() })
      .from(filmStatus)
      .where(and(eq(filmStatus.userId, userId), gt(sql`cardinality(${filmStatus.ownedFormats})`, 0)));
    ownedCount = row?.n ?? 0;
  }

  return rows.map((l) => ({
    ...l,
    itemCount: l.kind === 'lists' ? (childCounts.get(l.id) ?? 0) : l.rule === 'owned' ? ownedCount : 0,
  }));
}

// The films in a films list, sorted by title. Only rule-based lists exist so
// far, so a list without a rule has no films yet.
export async function getListFilms(list: List, userId: number | null): Promise<FilmWithWins[]> {
  if (list.rule !== 'owned' || userId === null) return [];
  const owned = await selectFilmsWithWins(userId, { ownedOnly: true });
  return owned.sort((a, b) => a.title.localeCompare(b.title) || a.releaseYear - b.releaseYear);
}
