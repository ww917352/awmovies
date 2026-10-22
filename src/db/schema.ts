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
  index,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 64 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  mustChangePassword: boolean('must_change_password').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(), // sha256 hex of the session cookie token
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // pruneExpiredSessions (called on every login) filters on this column.
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

// Backs login rate limiting (see src/lib/rate-limit.ts). One row per
// bucket — e.g. "login:ip:1.2.3.4" or "login:user:wei" — so a failed
// login is throttled by both IP and username independently; whichever
// hits its threshold first locks. Not a sessions-style table: rows here
// are small, short-lived counters, cleaned up opportunistically.
export const rateLimitAttempts = pgTable('rate_limit_attempts', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  windowStart: timestamp('window_start').notNull().defaultNow(),
  lockedUntil: timestamp('locked_until'),
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
    // For "does this film have a win" lookups (getListOnlyFilms, the seed's
    // orphan check), which the unique index above can't serve.
    filmIdx: index('award_wins_film_id_idx').on(table.filmId),
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
// pin — see getUserSettings in queries.ts. `lockWatched` stops the list
// views' Watched checkbox from being unticked once ticked (the film page
// can still change it), guarding against accidental taps.
export const userSettings = pgTable('user_settings', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  pinnedYear: integer('pinned_year'),
  lockWatched: boolean('lock_watched').notNull().default(false),
});

// A director a list is about (see lists.directorId), shown as the list's
// header. Keyed by name, which matches the names in films.directors.
export const directors = pgTable('directors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  birthYear: integer('birth_year').notNull(),
  deathYear: integer('death_year'),
  photoUrl: text('photo_url'),
  wikiUrl: text('wiki_url'),
  letterboxdUrl: text('letterboxd_url'),
});

export const listKindValues = ['films', 'lists'] as const;
export const listRuleValues = ['owned'] as const;

// A list holds either films (kind 'films') or other lists (kind 'lists'),
// nested via parentId — a 'lists' list's sublists are the rows pointing at
// it. A films list with a `rule` is computed per viewer instead of stored:
// 'owned' is every film the logged-in user has an owned format for (see
// getListFilms in queries.ts). A films list without a rule holds a fixed set
// of films in listFilms. A list with a `directorId` is that director's
// filmography. Lists are defined in src/db/seed/lists/.
export const lists = pgTable(
  'lists',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    sourceUrl: text('source_url'),
    kind: varchar('kind', { length: 8, enum: listKindValues }).notNull(),
    rule: varchar('rule', { length: 16, enum: listRuleValues }),
    parentId: integer('parent_id').references((): AnyPgColumn => lists.id, { onDelete: 'cascade' }),
    directorId: integer('director_id').references(() => directors.id, { onDelete: 'set null' }),
    position: integer('position').notNull().default(0),
  },
  (table) => ({
    kindCheck: check('lists_kind_check', sql`${table.kind} in ('films', 'lists')`),
    ruleCheck: check('lists_rule_check', sql`${table.rule} is null or (${table.kind} = 'films' and ${table.rule} in ('owned'))`),
    parentIdx: index('lists_parent_id_idx').on(table.parentId),
  })
);

// The films in a fixed (rule-less) films list. `rank` is the film's place on
// the list as published — tied films share a rank — and `position` is the
// display order, which also breaks ties. `section` groups the list's films
// under headings, e.g. "Feature films" and "Short films" in a filmography.
export const listFilms = pgTable(
  'list_films',
  {
    listId: integer('list_id')
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade' }),
    filmId: integer('film_id')
      .notNull()
      .references(() => films.id, { onDelete: 'cascade' }),
    rank: integer('rank'),
    section: text('section'),
    position: integer('position').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.listId, table.filmId] }),
    filmIdx: index('list_films_film_id_idx').on(table.filmId),
  })
);

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
