export function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export const AWARD_ABBR: Record<string, string> = {
  'oscar-best-picture': 'Oscar · Best Picture',
  'oscar-foreign-language': 'Oscar · Int’l Feature',
  'cannes-palme-dor': 'Cannes · Palme d’Or',
  'venice-golden-lion': 'Venice · Golden Lion',
  'berlin-golden-bear': 'Berlin · Golden Bear',
};

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

// The five awards in the order the Awards tab shows them, with the two-part
// name an award card heads itself with and a short code for the year picker.
export const AWARDS: { slug: string; org: string; prize: string; short: string }[] = [
  { slug: 'oscar-best-picture', org: 'Academy Awards', prize: 'Best Picture', short: 'Picture' },
  { slug: 'oscar-foreign-language', org: 'Academy Awards', prize: 'International Feature', short: 'Int’l' },
  { slug: 'cannes-palme-dor', org: 'Cannes', prize: 'Palme d’Or', short: 'Palme' },
  { slug: 'venice-golden-lion', org: 'Venice', prize: 'Golden Lion', short: 'Lion' },
  { slug: 'berlin-golden-bear', org: 'Berlin', prize: 'Golden Bear', short: 'Bear' },
];

// A film page link that returns to `back` (see the film page's Back link).
export function filmHref(filmId: number, back: string) {
  return `/films/${filmId}?back=${encodeURIComponent(back)}`;
}
