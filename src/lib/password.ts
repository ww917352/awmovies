// Pure crypto helpers with no Next.js dependency, so they're safe to import
// from standalone scripts (scripts/create-user.ts, scripts/claim-owner.ts)
// as well as from route handlers via @/lib/auth.
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';
import { passwordPolicyErrors } from '@/lib/password-policy';

export { passwordPolicyErrors };

const SCRYPT_KEYLEN = 64;

// OWASP's current baseline recommendation for scrypt (N=2^17, r=8, p=1).
// Cost parameters are stored in the hash string itself (rather than fixed
// in code) precisely so they can be raised again later without breaking
// verification of hashes written under the old ones.
const CURRENT_PARAMS = { N: 2 ** 17, r: 8, p: 1 };

// Node's own scryptSync defaults, from before this file stored parameters
// explicitly — needed to keep verifying hashes written before this change
// (format: scrypt$salt$hash, no N/r/p segment).
const LEGACY_PARAMS = { N: 16384, r: 8, p: 1 };

// Memory required is ~128 * N * r bytes; scryptSync throws past its
// maxmem (default 32MiB) if that exceeds it, which CURRENT_PARAMS
// (128MiB) already does.
function scryptMaxmem(params: { N: number; r: number }): number {
  return Math.max(32 * 1024 * 1024, 128 * params.N * params.r * 2);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const { N, r, p } = CURRENT_PARAMS;
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, { N, r, p, maxmem: scryptMaxmem(CURRENT_PARAMS) }).toString(
    'hex'
  );
  return `scrypt$${N}$${r}$${p}$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$');

    let algo: string, N: number, r: number, p: number, salt: string, hash: string;
    if (parts.length === 6) {
      [algo, , , , salt, hash] = parts;
      N = Number(parts[1]);
      r = Number(parts[2]);
      p = Number(parts[3]);
    } else if (parts.length === 3) {
      [algo, salt, hash] = parts;
      ({ N, r, p } = LEGACY_PARAMS);
    } else {
      return false;
    }

    if (algo !== 'scrypt' || !salt || !hash || !Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
      return false;
    }

    const hashBuf = Buffer.from(hash, 'hex');
    const candidate = scryptSync(password, salt, SCRYPT_KEYLEN, { N, r, p, maxmem: scryptMaxmem({ N, r }) });
    if (candidate.length !== hashBuf.length) return false;
    return timingSafeEqual(candidate, hashBuf);
  } catch {
    return false;
  }
}

const PASSWORD_CHARS =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*-_+=';

export function generateStrongPassword(length = 16): string {
  let password: string;
  do {
    password = Array.from({ length }, () => PASSWORD_CHARS[randomInt(PASSWORD_CHARS.length)]).join('');
  } while (passwordPolicyErrors(password).length > 0);
  return password;
}
