import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  date,
  varchar,
  unique,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(), // sha256 hex of the session cookie token
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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

// Composite-keyed on (userId, filmId): each user has their own watched/owned
// status for a film. Anonymous (logged-out) visitors have no row and see
// blank status — see getAllFilms/getAllWins in queries.ts.
export const filmStatus = pgTable(
  'film_status',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    filmId: integer('film_id')
      .notNull()
      .references(() => films.id, { onDelete: 'cascade' }),
    watched: boolean('watched').notNull().default(false),
    watchedDate: date('watched_date'),
    ownedFormats: text('owned_formats').array().notNull().default([]),
    digitalQuality: varchar('digital_quality', { length: 8 }),
    notes: text('notes'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.filmId] }),
  })
);

// One row per user holding their personal preferences, e.g. the pinned
// starting year for the home page. Logged-out visitors have no row and no
// pin — see getPinnedYear in queries.ts.
export const userSettings = pgTable('user_settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  pinnedYear: integer('pinned_year'),
});

export const awardsRelations = relations(awards, ({ many }) => ({
  wins: many(awardWins),
}));

export const filmsRelations = relations(films, ({ many }) => ({
  wins: many(awardWins),
  statuses: many(filmStatus),
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
  user: one(users, {
    fields: [filmStatus.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  filmStatuses: many(filmStatus),
  sessions: many(sessions),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));
