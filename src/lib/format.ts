export function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function formatOwnedLabel(status: { ownedFormats: string[]; digitalQuality: string | null }): string | null {
  if (status.ownedFormats.length === 0) return null;
  return status.ownedFormats
    .map((f) => {
      if (f === 'digital') return status.digitalQuality ? `Digital (${status.digitalQuality.toUpperCase()})` : 'Digital';
      if (f === 'dvd') return 'DVD';
      if (f === 'bluray') return 'Blu-ray';
      return f;
    })
    .join(', ');
}

// The awards app-side metadata, in the order the Awards tab shows them:
// `org`/`prize` head an award card, `label` is the one-line name used in
// labels and chips' long form, `chip` the Movies filter chip, `short` the year
// picker's column code. Awards in the database but missing here still show,
// after these, under their database name (see awardInfo).
export type AwardInfo = { slug: string; org: string; prize: string; label: string; chip: string; short: string };

export const AWARDS: AwardInfo[] = [
  { slug: 'oscar-best-picture', org: 'Academy Awards', prize: 'Best Picture', label: 'Oscar · Best Picture', chip: 'Best Picture', short: 'Pic' },
  { slug: 'oscar-foreign-language', org: 'Academy Awards', prize: 'International Feature', label: 'Oscar · Int’l Feature', chip: 'Int’l Feature', short: 'Int' },
  { slug: 'cannes-palme-dor', org: 'Cannes', prize: 'Palme d’Or', label: 'Cannes · Palme d’Or', chip: 'Palme d’Or', short: 'Pal' },
  { slug: 'venice-golden-lion', org: 'Venice', prize: 'Golden Lion', label: 'Venice · Golden Lion', chip: 'Golden Lion', short: 'Lio' },
  { slug: 'berlin-golden-bear', org: 'Berlin', prize: 'Golden Bear', label: 'Berlin · Golden Bear', chip: 'Golden Bear', short: 'Bea' },
];

const AWARDS_BY_SLUG = new Map(AWARDS.map((a) => [a.slug, a]));

// Metadata for any award, falling back to its database organization/name.
export function awardInfo(award: { slug: string; organization: string; name: string }): AwardInfo {
  return (
    AWARDS_BY_SLUG.get(award.slug) ?? {
      slug: award.slug,
      org: award.organization,
      prize: award.name,
      label: `${award.organization} · ${award.name}`,
      chip: award.name,
      short: award.name.slice(0, 3),
    }
  );
}

// The one-line label for an award slug, e.g. "Cannes · Palme d’Or".
export function awardLabel(slug: string, fallbackName: string): string {
  return AWARDS_BY_SLUG.get(slug)?.label ?? fallbackName;
}

// Awards in display order: the known ones first, then any others the
// database has, in the order given.
export function orderAwards<T extends { slug: string }>(awards: T[]): T[] {
  const rank = (slug: string) => {
    const i = AWARDS.findIndex((a) => a.slug === slug);
    return i === -1 ? AWARDS.length : i;
  };
  return [...awards].sort((a, b) => rank(a.slug) - rank(b.slug));
}

// A film page link that returns to `back` (see the film page's Back link).
export function filmHref(filmId: number, back: string) {
  return `/films/${filmId}?back=${encodeURIComponent(back)}`;
}
