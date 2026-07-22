// One-time script for the single-user -> multi-user migration (see
// drizzle/0005_bouncy_patriot.sql): that migration attributes every
// pre-existing film_status row to a placeholder account, "__pending_owner__",
// since the new schema requires every row to have an owning user. This
// script claims that placeholder — renaming it to a real username and
// setting a real password — so the existing watched/owned data ends up
// owned by that user. Safe to run once; errors if already claimed.
//
// Usage:
//   DATABASE_URL="..." npx tsx scripts/claim-owner.ts <username> [password]
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { hashPassword, passwordPolicyErrors, generateStrongPassword } from '../src/lib/password';

const PLACEHOLDER_USERNAME = '__pending_owner__';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const [usernameArg, passwordArg] = process.argv.slice(2);
  if (!usernameArg) {
    console.error('Usage: npx tsx scripts/claim-owner.ts <username> [password]');
    process.exit(1);
  }

  const username = usernameArg.trim().toLowerCase();
  let password = passwordArg;
  let generated = false;

  if (!password) {
    password = generateStrongPassword();
    generated = true;
  } else {
    const errors = passwordPolicyErrors(password);
    if (errors.length > 0) {
      console.error(`Password must contain ${errors.join(', ')}.`);
      process.exit(1);
    }
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const [placeholder] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, PLACEHOLDER_USERNAME));

  if (!placeholder) {
    console.error(
      `No "${PLACEHOLDER_USERNAME}" placeholder account found — either it's already been claimed, or migration 0005 hasn't run yet.`
    );
    await pool.end();
    process.exit(1);
  }

  const [usernameTaken] = await db.select().from(schema.users).where(eq(schema.users.username, username));
  if (usernameTaken) {
    console.error(`User "${username}" already exists.`);
    await pool.end();
    process.exit(1);
  }

  await db
    .update(schema.users)
    .set({ username, passwordHash: hashPassword(password), mustChangePassword: true })
    .where(eq(schema.users.id, placeholder.id));

  console.log(`Claimed the pre-existing watched/owned data as user "${username}".`);
  if (generated) {
    console.log(`Generated password: ${password}`);
  }
  console.log('They will be required to change this password on first login.');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
