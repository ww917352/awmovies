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
});

export const db = drizzle(pool, { schema });
