# Award-Winning Movies

A personal catalog of winning films from five major film awards, across their
full history:

- Academy Award for Best Picture (Oscars)
- Academy Award for Best International Feature Film, formerly Best Foreign
  Language Film (Oscars)
- Palme d'Or (Cannes Film Festival)
- Golden Lion (Venice Film Festival)
- Golden Bear (Berlin International Film Festival / Berlinale)

For each film: director(s), studio(s), main cast, Wikipedia link, and a
best-effort Letterboxd link — plus a personal "watched" and "owned"
(DVD / Blu-ray / Digital, with quality) tracking, scoped per logged-in user.

Anyone can browse the whole catalog without logging in. Watched/owned status
is only visible and editable once logged in, and is private to that account.
There's no self-service registration — new accounts are created manually (see
"Adding users" below) for friends the admin invites.

## Tech stack

- Next.js 14 (App Router, TypeScript) — Server Components for reads, a Route
  Handler for the one write endpoint (film status updates)
- Drizzle ORM + `pg` — works identically against local Docker Postgres and a
  Neon connection string
- Tailwind CSS
- Postgres 16 (Docker locally, Neon in the cloud)

## Running locally (Docker Compose + Colima)

Make sure Colima is running (`colima start` if it isn't) and that
`DOCKER_HOST` points at its socket — `docker info` should succeed.

```bash
docker-compose up --build
```

This starts three services:
1. `db` — Postgres 16
2. `migrate` — runs once: applies the schema (`drizzle-kit` migrations) then
   seeds all award/film data from `src/db/seed/*.json`
3. `app` — the Next.js app, served at http://localhost:3000

Re-running `docker-compose up` is safe — both the migration and the seed
script are idempotent.

To stop and remove containers (keeping the DB volume, i.e. your watched/owned
data): `docker-compose down`. To also wipe the database: `docker-compose down -v`.

### Developing without Docker

```bash
npm install
docker-compose up db -d          # just the database
cp .env.example .env             # DATABASE_URL already points at localhost:5432
npm run db:migrate
npm run seed
npm run dev
```

## Data seeding

Award data lives in `src/db/seed/*.json`, one or more files per award (a
single award can be split across multiple files covering different year
ranges — `scripts/seed.ts` upserts by award slug and by film
`(title, releaseYear)`, so this is safe). Each file has the shape:

```json
{
  "slug": "oscar-best-picture",
  "organization": "Academy Awards",
  "name": "Academy Award for Best Picture",
  "wins": [
    {
      "year": 1976,
      "editionLabel": "48th Academy Awards",
      "title": "One Flew Over the Cuckoo's Nest",
      "releaseYear": 1975,
      "directors": ["Milos Forman"],
      "studios": ["Fantasy Films"],
      "mainCast": ["Jack Nicholson", "Louise Fletcher"],
      "wikiUrl": "https://en.wikipedia.org/wiki/...",
      "letterboxdUrl": "https://letterboxd.com/film/...",
      "letterboxdUnverified": true
    }
  ]
}
```

Data was compiled from Wikipedia's "List of winners" pages plus each film's
own infobox. Letterboxd doesn't have a public API and its URL slugs aren't
always predictable, so `letterboxdUrl` is a best-effort guess whenever
`letterboxdUnverified` is `true` — check those links and correct them in the
JSON (then re-run `npm run seed`) as you notice wrong ones.

Re-run `npm run seed` any time after editing/adding seed JSON files to apply
the changes.

## Adding users

There's no registration UI. To add a friend, pick a username and either give
them an initial password or let the script generate a strong one:

```bash
DATABASE_URL="..." npm run create-user -- <username> [password]
```

The account is created with `must_change_password` set, so they're forced to
pick their own (strong) password on first login. Password requirements: at
least 8 characters, with an uppercase letter, a lowercase letter, a number,
and a symbol — enforced both here and in the change-password form.

### Migrating existing single-user watched/owned data

Migration `drizzle/0005_bouncy_patriot.sql` (the single-user → multi-user
schema change) attributes every pre-existing `film_status` row to a
placeholder account, `__pending_owner__`, since every row now requires an
owning user. After running that migration, claim the placeholder as a real
account:

```bash
DATABASE_URL="..." npm run claim-owner -- <username> [password]
```

This renames `__pending_owner__` to `<username>` and sets its password (again
forcing a change on first login) — so all the pre-existing watched/owned data
ends up owned by that account. Run once per database (local, then Neon).

## Deploying to Vercel + Neon

1. Create a Neon project (https://neon.tech) and copy its **pooled**
   connection string (the one with `-pooler` in the hostname).
2. In your Vercel project settings, add an environment variable
   `DATABASE_URL` with that connection string (include `?sslmode=require`).
3. Run the schema migration and seed against Neon from your machine:
   ```bash
   DATABASE_URL="<neon-pooled-connection-string>" npm run db:migrate
   DATABASE_URL="<neon-pooled-connection-string>" npm run seed
   ```
   The first time you run the migration that adds multi-user support, also
   claim the pre-existing watched/owned data as a real account (see
   "Migrating existing single-user watched/owned data" above):
   ```bash
   DATABASE_URL="<neon-pooled-connection-string>" npm run claim-owner -- <username>
   ```
4. Deploy the repo to Vercel as normal (`vercel --prod`, or connect the Git
   repo in the Vercel dashboard). No other config is needed — this is a
   standard Next.js App Router project.

## Project layout

```
src/app/                    pages + the film-status/auth Route Handlers
src/lib/auth.ts              sessions, cookies, getCurrentUser()
src/lib/password.ts          password hashing/verification/policy (no Next.js deps)
src/middleware.ts            edge redirect to /change-password while pending
src/db/schema.ts             Drizzle schema (users, sessions, awards, films, award_wins, film_status)
src/db/client.ts             pg Pool + drizzle()
src/db/queries.ts            read queries used by Server Components
src/db/seed/*.json            per-award seed data
scripts/migrate.ts            applies drizzle/ migrations
scripts/seed.ts               loads src/db/seed/*.json into the database
scripts/create-user.ts        adds a new user (see "Adding users")
scripts/claim-owner.ts        one-time: attach pre-existing watched/owned data to a real user
drizzle/                      generated SQL migrations
docker-compose.yml
Dockerfile
```
