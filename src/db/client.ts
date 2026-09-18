import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon's certificate chains to a public CA, so the default system trust
  // store verifies it — no need to (and no reason to) skip verification.
  ssl: process.env.DATABASE_URL.includes('sslmode=require')
    ? { rejectUnauthorized: true }
    : undefined,
  // Explicit rather than relying on pg's default (also 10) — each
  // serverless instance gets its own pool, so this is the real ceiling on
  // how many connections one instance can hold open against Postgres.
  // Neon's pooled connection string absorbs most of the multi-instance
  // fan-out on top of this.
  max: 10,
});

export const db = drizzle(pool, { schema });
