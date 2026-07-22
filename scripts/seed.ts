import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
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

const SEED_DIR = path.join(__dirname, '../src/db/seed');

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
          originalTitle: win.originalTitle,
          releaseYear: win.releaseYear,
          directors: win.directors ?? [],
          studios: win.studios ?? [],
          mainCast: win.mainCast ?? [],
          wikiUrl: win.wikiUrl,
          letterboxdUrl: win.letterboxdUrl,
          letterboxdUnverified: win.letterboxdUnverified ?? false,
          appleTvUrl: win.appleTvUrl,
          posterUrl: win.posterUrl,
          plotSummary: win.plotSummary,
        })
        .onConflictDoUpdate({
          target: [schema.films.title, schema.films.releaseYear],
          set: {
            originalTitle: win.originalTitle,
            directors: win.directors ?? [],
            studios: win.studios ?? [],
            mainCast: win.mainCast ?? [],
            wikiUrl: win.wikiUrl,
            letterboxdUrl: win.letterboxdUrl,
            letterboxdUnverified: win.letterboxdUnverified ?? false,
            appleTvUrl: win.appleTvUrl,
            posterUrl: win.posterUrl,
            plotSummary: win.plotSummary,
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

      const statusExists = await db
        .select()
        .from(schema.filmStatus)
        .where(eq(schema.filmStatus.filmId, film.id));
      if (statusExists.length === 0) {
        await db.insert(schema.filmStatus).values({ filmId: film.id });
      }

      winCount++;
    }
  }

  console.log(`Seeded ${awardCount} awards, ${filmCount} film entries, ${winCount} wins.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
