import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, notInArray } from 'drizzle-orm';
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

// Nested: a 'lists' entry's `lists` are its sublists, in display order.
type SeedList = {
  slug: string;
  title: string;
  description?: string;
  kind: (typeof schema.listKindValues)[number];
  rule?: (typeof schema.listRuleValues)[number];
  lists?: SeedList[];
};

const SEED_DIR = path.join(__dirname, '../src/db/seed');
const LISTS_FILE = path.join(SEED_DIR, 'lists/lists.json');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json'));

  let awardCount = 0;
  let filmCount = 0;
  let winCount = 0;

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
      const [film] = await db
        .insert(schema.films)
        .values({
          title: win.title,
          originalTitle: win.originalTitle ?? null,
          releaseYear: win.releaseYear,
          directors: win.directors ?? [],
          studios: win.studios ?? [],
          mainCast: win.mainCast ?? [],
          wikiUrl: win.wikiUrl ?? null,
          letterboxdUrl: win.letterboxdUrl ?? null,
          letterboxdUnverified: win.letterboxdUnverified ?? false,
          appleTvUrl: win.appleTvUrl ?? null,
          posterUrl: win.posterUrl ?? null,
          plotSummary: win.plotSummary ?? null,
        })
        .onConflictDoUpdate({
          target: [schema.films.title, schema.films.releaseYear],
          set: {
            originalTitle: win.originalTitle ?? null,
            directors: win.directors ?? [],
            studios: win.studios ?? [],
            mainCast: win.mainCast ?? [],
            wikiUrl: win.wikiUrl ?? null,
            letterboxdUrl: win.letterboxdUrl ?? null,
            letterboxdUnverified: win.letterboxdUnverified ?? false,
            appleTvUrl: win.appleTvUrl ?? null,
            posterUrl: win.posterUrl ?? null,
            plotSummary: win.plotSummary ?? null,
          },
        })
        .returning();
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

  async function upsertLists(entries: SeedList[], parentId: number | null) {
    for (const [position, entry] of entries.entries()) {
      if (entry.kind !== 'lists' && entry.lists?.length) {
        throw new Error(`List "${entry.slug}" has sublists but kind "${entry.kind}"`);
      }
      const values = {
        title: entry.title,
        description: entry.description ?? null,
        kind: entry.kind,
        rule: entry.rule ?? null,
        parentId,
        position,
      };
      const [list] = await db
        .insert(schema.lists)
        .values({ slug: entry.slug, ...values })
        .onConflictDoUpdate({ target: schema.lists.slug, set: values })
        .returning();
      listSlugs.push(entry.slug);
      await upsertLists(entry.lists ?? [], list.id);
    }
  }

  await upsertLists(seedLists, null);
  await db.delete(schema.lists).where(notInArray(schema.lists.slug, listSlugs));

  console.log(
    `Seeded ${awardCount} awards, ${filmCount} film entries, ${winCount} wins, ${listSlugs.length} lists.`
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
