// Narrows an attacker-controlled `?back=` value down to a same-site path,
// for use as a redirect target. A simple `startsWith('/') &&
// !startsWith('//')` check is not enough — browsers normalise a leading
// backslash to a forward slash in the authority position, so "/\evil.com"
// and "/\/evil.com" both resolve to "http://evil.com" even though they
// pass that check. Parsing against a placeholder base and comparing the
// resulting origin catches those (and anything else the URL parser would
// treat as absolute) without needing to enumerate bypass patterns by hand.
const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

export function toSafeRelativePath(value: string | undefined, fallback = '/'): string {
  if (!value) return fallback;
  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  return url.origin === PLACEHOLDER_ORIGIN ? url.pathname + url.search + url.hash : fallback;
}
