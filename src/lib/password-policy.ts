// Pure, dependency-free password rules — safe to import from client
// components (for a live strength checklist) as well as from @/lib/password
// (server-side hashing/validation) and the admin scripts.
export const MIN_PASSWORD_LENGTH = 8;

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

export function passwordPolicyErrors(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.clause);
}
