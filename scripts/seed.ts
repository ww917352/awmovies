import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, notExists, notInArray } from 'drizzle-orm';
import * as schema from '../src/db/schema';

type SeedWin = {
  year: number;
  editionLabel?: string;
  title: string;
  originalTitle?: string;
  releaseYear: number;
  directors: string[];
  studios: string[];
  mainCast: string[];
  wikiUrl?: string;
  letterboxdUrl?: string;
  letterboxdUnverified?: boolean;
  appleTvUrl?: string;
  posterUrl?: string;
  plotSummary?: string;
};

type SeedFile = {
  slug: string;
  organization: string;
  name: string;
  wins: SeedWin[];
};

type SeedFilm = Omit<SeedWin, 'year' | 'editionLabel'>;

type SeedDirector = {
  name: string;
  birthYear: number;
  deathYear?: number;
  photoUrl?: string;
  wikiUrl?: string;
  letterboxdUrl?: string;
};

// Nested: a 'lists' entry's `lists` are its sublists, in display order. A
// films entry without a `rule` names a `films` file in src/db/seed/lists/
// holding its films, in display order. A `director` makes the list that
// director's filmography, with the director shown as its header.
type SeedList = {
  slug: string;
  title: string;
  description?: string;
  sourceUrl?: string;
  kind: (typeof schema.listKindValues)[number];
  rule?: (typeof schema.listRuleValues)[number];
  films?: string;
  lists?: SeedList[];
  director?: SeedDirector;
};

// An entry with just title + releaseYear (and rank) refers to a film already
// seeded from the award files, so its data lives in one place; any other
// entry carries the film's full data and is upserted like an award winner —
// which is only allowed for a film that's in no award file. `section` is the
// heading the film is listed under, if the list has sections.
type SeedListFilm = { rank?: number; section?: string; title: string; releaseYear: number } & Partial<SeedFilm>;

const REFERENCE_KEYS = new Set(['rank', 'section', 'title', 'releaseYear']);

const filmKey = (film: { title: string; releaseYear: number }) => `${film.title} (${film.releaseYear})`;

const SEED_DIR = path.join(__dirname, '../src/db/seed');
const LISTS_DIR = path.join(SEED_DIR, 'lists');
const LISTS_FILE = path.join(LISTS_DIR, 'lists.json');

function filmValues(film: SeedFilm) {
  return {
    originalTitle: film.originalTitle ?? null,
    directors: film.directors ?? [],
    studios: film.studios ?? [],
    mainCast: film.mainCast ?? [],
    wikiUrl: film.wikiUrl ?? null,
    letterboxdUrl: film.letterboxdUrl ?? null,
    letterboxdUnverified: film.letterboxdUnverified ?? false,
    appleTvUrl: film.appleTvUrl ?? null,
    posterUrl: film.posterUrl ?? null,
    plotSummary: film.plotSummary ?? null,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // One transaction, so a failed run (e.g. a list file error) leaves the
  // database as it was instead of half-seeded.
  await drizzle(pool, { schema }).transaction(async (db) => {
    const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));

    async function upsertFilm(film: SeedFilm) {
      const values = filmValues(film);
      const [row] = await db
        .insert(schema.films)
        .values({ title: film.title, releaseYear: film.releaseYear, ...values })
        .onConflictDoUpdate({ target: [schema.films.title, schema.films.releaseYear], set: values })
        .returning();
      return row;
    }

    let awardCount = 0;
    let filmCount = 0;
    let winCount = 0;
    const awardFilms = new Set<string>();
    const seenWins = new Set<string>();

    for (const file of files) {
      const raw = readFileSync(path.join(SEED_DIR, file), 'utf-8');
      const data: SeedFile = JSON.parse(raw);

      const [award] = await db
        .insert(schema.awards)
        .values({ slug: data.slug, organization: data.organization, name: data.name })
        .onConflictDoUpdate({
          target: schema.awards.slug,
          set: { organization: data.organization, name: data.name },
        })
        .returning();
      awardCount++;

      for (const win of data.wins) {
        const winKey = `${data.slug} ${win.year} ${filmKey(win)}`;
        if (seenWins.has(winKey)) throw new Error(`${file}: duplicate win ${winKey}`);
        seenWins.add(winKey);
        awardFilms.add(filmKey(win));

        const film = await upsertFilm(win);
        filmCount++;

        const existing = await db
          .select()
          .from(schema.awardWins)
          .where(
            and(
              eq(schema.awardWins.awardId, award.id),
              eq(schema.awardWins.year, win.year),
              eq(schema.awardWins.filmId, film.id)
            )
          );

        if (existing.length === 0) {
          await db.insert(schema.awardWins).values({
            awardId: award.id,
            filmId: film.id,
            year: win.year,
            editionLabel: win.editionLabel,
          });
        }

        winCount++;
      }
    }

    // lists.json is the source of truth for lists (they hold no user data),
    // so lists dropped from the file are deleted rather than left orphaned.
    const seedLists: SeedList[] = JSON.parse(readFileSync(LISTS_FILE, 'utf-8'));
    const listSlugs: string[] = [];
    let listFilmCount = 0;

    // Replaces the list's films with the file's, so films dropped from the file
    // leave the list (the films themselves stay in the catalog).
    async function seedListFilms(listId: number, file: string) {
      const entries: SeedListFilm[] = JSON.parse(readFileSync(path.join(LISTS_DIR, file), 'utf-8'));
      const rows: (typeof schema.listFilms.$inferInsert)[] = [];
      const seen = new Set<string>();
      for (const [position, entry] of entries.entries()) {
        const key = filmKey(entry);
        if (seen.has(key)) throw new Error(`${file}: ${key} is listed twice`);
        seen.add(key);

        let filmId: number;
        const isReference = Object.keys(entry).every((k) => REFERENCE_KEYS.has(k));
        if (!isReference) {
          if (awardFilms.has(key)) {
            throw new Error(`${file}: ${key} is in an award file — list it by title, releaseYear, rank and section only`);
          }
          if (!Array.isArray(entry.directors)) {
            throw new Error(`${file}: ${key} has film data but no directors — give full data or only title, releaseYear, rank and section`);
          }
          filmId = (await upsertFilm(entry as SeedFilm)).id;
        } else {
          const [film] = await db
            .select({ id: schema.films.id })
            .from(schema.films)
            .where(and(eq(schema.films.title, entry.title), eq(schema.films.releaseYear, entry.releaseYear)));
          if (!film) throw new Error(`${file}: ${key} isn't in the catalog`);
          filmId = film.id;
        }
        rows.push({ listId, filmId, rank: entry.rank ?? null, section: entry.section ?? null, position });
      }
      await db.delete(schema.listFilms).where(eq(schema.listFilms.listId, listId));
      if (rows.length) await db.insert(schema.listFilms).values(rows);
      listFilmCount += rows.length;
    }

    async function upsertDirector(director: SeedDirector) {
      const values = {
        birthYear: director.birthYear,
        deathYear: director.deathYear ?? null,
        photoUrl: director.photoUrl ?? null,
        wikiUrl: director.wikiUrl ?? null,
        letterboxdUrl: director.letterboxdUrl ?? null,
      };
      const [row] = await db
        .insert(schema.directors)
        .values({ name: director.name, ...values })
        .onConflictDoUpdate({ target: schema.directors.name, set: values })
        .returning();
      return row;
    }

    async function upsertLists(entries: SeedList[], parentId: number | null) {
      for (const [position, entry] of entries.entries()) {
        if (entry.kind !== 'lists' && entry.lists?.length) {
          throw new Error(`List "${entry.slug}" has sublists but kind "${entry.kind}"`);
        }
        if (entry.films && (entry.kind !== 'films' || entry.rule)) {
          throw new Error(`List "${entry.slug}" has a films file but isn't a rule-less films list`);
        }
        const values = {
          title: entry.title,
          description: entry.description ?? null,
          sourceUrl: entry.sourceUrl ?? null,
          kind: entry.kind,
          rule: entry.rule ?? null,
          parentId,
          directorId: entry.director ? (await upsertDirector(entry.director)).id : null,
          position,
        };
        const [list] = await db
          .insert(schema.lists)
          .values({ slug: entry.slug, ...values })
          .onConflictDoUpdate({ target: schema.lists.slug, set: values })
          .returning();
        listSlugs.push(entry.slug);
        if (entry.films) await seedListFilms(list.id, entry.films);
        await upsertLists(entry.lists ?? [], list.id);
      }
    }

    await upsertLists(seedLists, null);
    await db.delete(schema.lists).where(notInArray(schema.lists.slug, listSlugs));

    // A film dropped from every list (and with no award win) stays in the
    // catalog to keep its users' watched/owned status, but no page lists it.
    const orphans = await db
      .select({ title: schema.films.title, releaseYear: schema.films.releaseYear })
      .from(schema.films)
      .where(
        and(
          notExists(db.select().from(schema.awardWins).where(eq(schema.awardWins.filmId, schema.films.id))),
          notExists(db.select().from(schema.listFilms).where(eq(schema.listFilms.filmId, schema.films.id)))
        )
      );
    for (const film of orphans) {
      console.warn(`Warning: ${filmKey(film)} has no award win and is in no list, so no page shows it.`);
    }

    console.log(
      `Seeded ${awardCount} awards, ${filmCount} film entries, ${winCount} wins, ${listSlugs.length} lists with ${listFilmCount} films.`
    );
  });
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
