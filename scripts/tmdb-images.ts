// Points every poster (films' posterUrl) and director photo (photoUrl) in the
// seed data at TMDB's image CDN, whose API terms allow non-commercial apps to
// display its images with attribution. Images from other sources (Wikipedia
// hosts most posters under a fair-use rationale that doesn't extend to
// reusers) are replaced, or removed when TMDB has none — the app then shows
// its placeholder.
//
// Films and people are matched by their TMDB ID on Wikidata (looked up from
// the seed's wikiUrl), falling back to a TMDB title + year search that only
// accepts a matching title. Seed files are edited as text, touching only the
// posterUrl/photoUrl lines, so their formatting is kept. Re-run after adding
// films; images already on TMDB are left alone. Then `npm run seed`.
//
// Usage:
//   TMDB_API_KEY=<v3 key> npx tsx scripts/tmdb-images.ts [--dry-run]
//   TMDB_READ_TOKEN=<v4 read access token> npx tsx scripts/tmdb-images.ts [--dry-run]
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';

const SEED_DIRS = ['src/db/seed', 'src/db/seed/lists'];
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original';
const USER_AGENT = 'PalmaresSeedImages/1.0 (https://github.com/ww917352/awmovies)';
const DRY_RUN = process.argv.includes('--dry-run');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Item = { kind: 'film' | 'person'; title: string; year?: number; wikiUrl?: string; imageUrl?: string };

// Film objects (title + releaseYear) and director objects (name + photoUrl).
function collect(value: unknown, into: Item[]) {
  if (Array.isArray(value)) return value.forEach((v) => collect(v, into));
  if (!value || typeof value !== 'object') return;
  const o = value as Record<string, unknown>;
  if (typeof o.title === 'string' && typeof o.releaseYear === 'number' && typeof o.posterUrl === 'string') {
    into.push({ kind: 'film', title: o.title, year: o.releaseYear, wikiUrl: o.wikiUrl as string, imageUrl: o.posterUrl });
  } else if (typeof o.name === 'string' && typeof o.photoUrl === 'string') {
    into.push({ kind: 'person', title: o.name, wikiUrl: o.wikiUrl as string, imageUrl: o.photoUrl });
  }
  Object.values(o).forEach((v) => collect(v, into));
}

function wikiTitle(url?: string): string | null {
  const m = url?.match(/^https?:\/\/en\.wikipedia\.org\/wiki\/(.+)$/);
  return m ? decodeURIComponent(m[1]).replace(/_/g, ' ') : null;
}

// enwiki title → TMDB id, via Wikidata (P4947 movie, P4985 person).
async function tmdbIdsFromWikidata(titles: string[], property: 'P4947' | 'P4985'): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const params = new URLSearchParams({
      action: 'wbgetentities',
      sites: 'enwiki',
      titles: batch.join('|'),
      props: 'claims|sitelinks',
      sitefilter: 'enwiki',
      format: 'json',
    });
    const res = await fetch(`https://www.wikidata.org/w/api.php?${params}`, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
    const data = (await res.json()) as { entities: Record<string, any> };
    for (const entity of Object.values(data.entities)) {
      const title = entity.sitelinks?.enwiki?.title as string | undefined;
      const id = entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value as string | undefined;
      if (title && id) out.set(title, id);
    }
    await sleep(1000);
  }
  return out;
}

function tmdbFetcher() {
  const key = process.env.TMDB_API_KEY;
  const token = process.env.TMDB_READ_TOKEN;
  if (!key && !token) return null;
  return async (pathAndQuery: string): Promise<any> => {
    const url = new URL(`https://api.themoviedb.org/3${pathAndQuery}`);
    if (key) url.searchParams.set('api_key', key);
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.status === 429 && attempt < 5) {
        await sleep(2000 * attempt);
        continue;
      }
      await sleep(150);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`TMDB HTTP ${res.status} for ${pathAndQuery}`);
      return res.json();
    }
  };
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

async function searchFilm(tmdb: NonNullable<ReturnType<typeof tmdbFetcher>>, title: string, year: number) {
  for (const y of [year, year - 1, year + 1]) {
    const data = await tmdb(`/search/movie?query=${encodeURIComponent(title)}&year=${y}`);
    const hit = (data?.results ?? []).find(
      (r: any) => fold(r.title ?? '') === fold(title) || fold(r.original_title ?? '') === fold(title)
    );
    if (hit) return String(hit.id);
  }
  return null;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replaces (or with `next` null, deletes) a "key": "old" line wherever it appears.
function rewriteLine(text: string, key: string, old: string, next: string | null): string {
  const value = escapeRegExp(JSON.stringify(old));
  if (next !== null) return text.replace(new RegExp(`("${key}": )${value}`, 'g'), `$1${JSON.stringify(next)}`);
  return text
    .replace(new RegExp(`\\n[ \\t]*"${key}": ${value},`, 'g'), '')
    .replace(new RegExp(`,\\n[ \\t]*"${key}": ${value}(?=\\n)`, 'g'), '');
}

async function main() {
  const files = SEED_DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(dir, f))
  );
  const items: Item[] = [];
  for (const file of files) collect(JSON.parse(readFileSync(file, 'utf8')), items);

  // One lookup per distinct image; the same film can sit in several files.
  const byImage = new Map<string, Item>();
  for (const item of items) if (!item.imageUrl!.startsWith('https://image.tmdb.org/')) byImage.set(item.imageUrl!, item);
  const todo = [...byImage.values()];
  console.log(`${todo.length} images not on TMDB yet (${todo.filter((t) => t.kind === 'film').length} posters)`);

  const filmIds = await tmdbIdsFromWikidata(
    todo.filter((t) => t.kind === 'film').flatMap((t) => wikiTitle(t.wikiUrl) ?? []),
    'P4947'
  );
  const personIds = await tmdbIdsFromWikidata(
    todo.filter((t) => t.kind === 'person').flatMap((t) => wikiTitle(t.wikiUrl) ?? []),
    'P4985'
  );
  const idFor = (t: Item) => {
    const title = wikiTitle(t.wikiUrl);
    return title ? (t.kind === 'film' ? filmIds : personIds).get(title) : undefined;
  };
  console.log(`Wikidata has a TMDB id for ${todo.filter(idFor).length} of ${todo.length}`);

  const tmdb = tmdbFetcher();
  if (!tmdb) {
    console.log('No TMDB_API_KEY / TMDB_READ_TOKEN set — stopping after the Wikidata lookup.');
    return;
  }

  const replacements = new Map<string, string | null>();
  const unmatched: string[] = [];
  for (const [i, t] of todo.entries()) {
    let id = idFor(t) ?? null;
    if (!id && t.kind === 'film') id = await searchFilm(tmdb, t.title, t.year!);
    const data = id ? await tmdb(t.kind === 'film' ? `/movie/${id}` : `/person/${id}`) : null;
    const imagePath: string | null = (t.kind === 'film' ? data?.poster_path : data?.profile_path) ?? null;
    replacements.set(t.imageUrl!, imagePath ? `${TMDB_IMAGE_BASE}${imagePath}` : null);
    if (!imagePath) unmatched.push(`${t.title}${t.year ? ` (${t.year})` : ''}${id ? ` — TMDB ${id} has no image` : ' — not found'}`);
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${todo.length}`);
  }

  if (!DRY_RUN) {
    for (const file of files) {
      const before = readFileSync(file, 'utf8');
      let text = before;
      for (const [old, next] of replacements) {
        text = rewriteLine(text, 'posterUrl', old, next);
        text = rewriteLine(text, 'photoUrl', old, next);
      }
      JSON.parse(text); // never write a file that no longer parses
      if (text !== before) writeFileSync(file, text);
    }
  }

  console.log(`${DRY_RUN ? '[dry run] would set' : 'Set'} ${[...replacements.values()].filter(Boolean).length} TMDB images.`);
  if (unmatched.length) {
    console.log(`${unmatched.length} without a TMDB image (${DRY_RUN ? 'would be' : ''} removed, placeholder shown):`);
    unmatched.forEach((u) => console.log(`  ${u}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
