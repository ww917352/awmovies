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
