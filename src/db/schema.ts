import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  varchar,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const awards = pgTable('awards', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  organization: text('organization').notNull(),
  name: text('name').notNull(),
});

export const films = pgTable(
  'films',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    originalTitle: text('original_title'),
    releaseYear: integer('release_year').notNull(),
    directors: text('directors').array().notNull().default([]),
    studios: text('studios').array().notNull().default([]),
    mainCast: text('main_cast').array().notNull().default([]),
    wikiUrl: text('wiki_url'),
    letterboxdUrl: text('letterboxd_url'),
    letterboxdUnverified: boolean('letterboxd_unverified').notNull().default(false),
    appleTvUrl: text('apple_tv_url'),
    posterUrl: text('poster_url'),
    plotSummary: text('plot_summary'),
  },
  (table) => ({
    titleYearUnique: unique('films_title_release_year_unique').on(
      table.title,
      table.releaseYear
    ),
  })
);

export const awardWins = pgTable(
  'award_wins',
  {
    id: serial('id').primaryKey(),
    awardId: integer('award_id')
      .notNull()
      .references(() => awards.id, { onDelete: 'cascade' }),
    filmId: integer('film_id')
      .notNull()
      .references(() => films.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    editionLabel: text('edition_label'),
  },
  (table) => ({
    awardYearFilmUnique: unique('award_wins_award_year_film_unique').on(
      table.awardId,
      table.year,
      table.filmId
    ),
  })
);

export const ownedFormatValues = ['dvd', 'bluray', 'digital'] as const;
export const digitalQualityValues = ['sd', 'hd', '4k'] as const;

export const filmStatus = pgTable('film_status', {
  filmId: integer('film_id')
    .primaryKey()
    .references(() => films.id, { onDelete: 'cascade' }),
  watched: boolean('watched').notNull().default(false),
  watchedDate: date('watched_date'),
  ownedFormats: text('owned_formats').array().notNull().default([]),
  digitalQuality: varchar('digital_quality', { length: 8 }),
  notes: text('notes'),
});

// Single-row table (id is always 1) holding app-wide preferences for this
// single-user app, e.g. the pinned starting year for the home page.
export const appSettings = pgTable('app_settings', {
  id: integer('id').primaryKey().default(1),
  pinnedYear: integer('pinned_year'),
});

export const awardsRelations = relations(awards, ({ many }) => ({
  wins: many(awardWins),
}));

export const filmsRelations = relations(films, ({ many, one }) => ({
  wins: many(awardWins),
  status: one(filmStatus, {
    fields: [films.id],
    references: [filmStatus.filmId],
  }),
}));

export const awardWinsRelations = relations(awardWins, ({ one }) => ({
  award: one(awards, {
    fields: [awardWins.awardId],
    references: [awards.id],
  }),
  film: one(films, {
    fields: [awardWins.filmId],
    references: [films.id],
  }),
}));

export const filmStatusRelations = relations(filmStatus, ({ one }) => ({
  film: one(films, {
    fields: [filmStatus.filmId],
    references: [films.id],
  }),
}));
