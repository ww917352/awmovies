// Pure crypto helpers with no Next.js dependency, so they're safe to import
// from standalone scripts (scripts/create-user.ts, scripts/claim-owner.ts)
// as well as from route handlers via @/lib/auth.
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';
import { passwordPolicyErrors } from '@/lib/password-policy';

export { passwordPolicyErrors };

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algo, salt, hash] = stored.split('$');
    if (algo !== 'scrypt' || !salt || !hash) return false;
    const hashBuf = Buffer.from(hash, 'hex');
    const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
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
