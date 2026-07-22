// Adds a new friend as a user. Run manually (this app has no self-service
// registration): the admin picks a username and an initial password (or lets
// this script generate one), hands it to the friend, and the app forces a
// password change on their first login (users.must_change_password).
//
// Usage:
//   DATABASE_URL="..." npx tsx scripts/create-user.ts <username> [password]
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';
import { hashPassword, passwordPolicyErrors, generateStrongPassword } from '../src/lib/password';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const [usernameArg, passwordArg] = process.argv.slice(2);
  if (!usernameArg) {
    console.error('Usage: npx tsx scripts/create-user.ts <username> [password]');
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

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.username, username));
  if (existing) {
    console.error(`User "${username}" already exists.`);
    await pool.end();
    process.exit(1);
  }

  await db.insert(schema.users).values({
    username,
    passwordHash: hashPassword(password),
    mustChangePassword: true,
  });

  console.log(`Created user "${username}".`);
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
