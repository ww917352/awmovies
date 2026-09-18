// Pure, dependency-free password rules — safe to import from client
// components (for a live strength checklist) as well as from @/lib/password
// (server-side hashing/validation) and the admin scripts.
//
// NIST SP 800-63B favors a longer minimum length over composition rules as
// the stronger lever against guessing, so this is 12 rather than the old 8;
// the composition requirements below are kept too since they're cheap and
// don't hurt.
export const MIN_PASSWORD_LENGTH = 12;

export type PasswordRequirement = {
  id: string;
  label: string; // standalone requirement text, e.g. "At least 8 characters"
  clause: string; // fragment for a combined message, e.g. "at least 8 characters"
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    clause: `at least ${MIN_PASSWORD_LENGTH} characters`,
    test: (p) => p.length >= MIN_PASSWORD_LENGTH,
  },
  { id: 'lower', label: 'A lowercase letter', clause: 'a lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', clause: 'an uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'A number', clause: 'a number', test: (p) => /[0-9]/.test(p) },
  { id: 'symbol', label: 'A symbol', clause: 'a symbol', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

// A short denylist of predictable passwords that would otherwise slip past
// the composition rules above — plain "password123" or "qwerty" already
// fail those (no uppercase, no symbol), but "Password123!" satisfies every
// rule while still being one of the first few guesses any real attacker
// tries. Not a full breach corpus (that would mean an external API call,
// e.g. HaveIBeenPwned's k-anonymity range endpoint, which is more than this
// app's threat model currently calls for) — just the composition-compliant
// variants of the handful of passwords everyone tries first.
const COMMON_PASSWORDS = new Set([
  'password123!', 'password1234!', 'passw0rd123!',
  'welcome123!', 'welcome1234!',
  'qwerty123!', 'qwertyuiop1!',
  'letmein123!',
  'admin123456!', 'administrator1!',
  'changeme123!', 'temppassword1!',
  'iloveyou123!', 'sunshine123!', 'princess123!', 'superman123!',
  'football123!', 'baseball123!', 'trustno1234!',
  'abcd1234efgh!', 'abcdefgh1234!',
]);

export function passwordPolicyErrors(password: string): string[] {
  const errors = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.clause);
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('not be a commonly used password');
  }
  return errors;
}
