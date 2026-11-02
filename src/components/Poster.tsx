// A film poster at 2:3, or a tinted placeholder with the title. Size it with
// `className` (e.g. "w-12"), and say how big it shows with `size` ('sm' up
// to ~80px wide, 'md' for cards and the film page) so TMDB images load at a
// matching width. Images come from Wikipedia or TMDB (the hosts the CSP in
// proxy.ts allows); any other URL gets the placeholder.
export default function Poster({
  src,
  title,
  size,
  className = '',
  rounded = 'rounded-md',
}: {
  src: string | null;
  title: string;
  size: 'sm' | 'md';
  className?: string;
  rounded?: string;
}) {
  const frame = `relative block aspect-[2/3] shrink-0 overflow-hidden bg-fill ${rounded} ${className}`;
  if (!src || !isAllowedImage(src)) {
    let hue = 0;
    for (const ch of title) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return (
      <span
        className={`${frame} grid place-items-center p-1.5 text-center text-[11px] font-semibold leading-tight`}
        style={{ background: `hsl(${hue} 25% 38%)`, color: `hsl(${hue} 30% 92%)` }}
        aria-hidden
      >
        {title}
      </span>
    );
  }
  return (
    <span className={frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...imageSources(src, size)}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className={`pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 ${rounded}`} />
    </span>
  );
}

const TMDB_IMAGE = /^https:\/\/image\.tmdb\.org\/t\/p\/[a-z0-9]+\//;
const WIKIMEDIA_IMAGE = /^https:\/\/upload\.wikimedia\.org\//;

export function isTmdbImage(url: string): boolean {
  return TMDB_IMAGE.test(url);
}

export function isAllowedImage(url: string): boolean {
  return TMDB_IMAGE.test(url) || WIKIMEDIA_IMAGE.test(url);
}

// Where an image comes from, for crediting it.
export function imageSource(url: string): { name: string; href: string } | null {
  if (TMDB_IMAGE.test(url)) return { name: 'TMDB', href: 'https://www.themoviedb.org/' };
  if (WIKIMEDIA_IMAGE.test(url)) return { name: 'Wikipedia', href: 'https://www.wikipedia.org/' };
  return null;
}

// Sized TMDB URL, or the original for other hosts (Wikipedia's resized
// thumbnails are rate-limited harder than originals).
export function sizedImage(url: string, width: 'w92' | 'w185' | 'w342' | 'w500'): string {
  return isTmdbImage(url) ? tmdbImage(url, width) : url;
}

// TMDB serves fixed widths: swap the size segment for the one we need.
export function tmdbImage(url: string, width: 'w92' | 'w185' | 'w342' | 'w500'): string {
  return url.replace(TMDB_IMAGE, `https://image.tmdb.org/t/p/${width}/`);
}

function imageSources(src: string, size: 'sm' | 'md') {
  if (!isTmdbImage(src)) return { src };
  return size === 'sm'
    ? { src: tmdbImage(src, 'w92'), srcSet: `${tmdbImage(src, 'w92')} 1x, ${tmdbImage(src, 'w185')} 2x` }
    : { src: tmdbImage(src, 'w342'), srcSet: `${tmdbImage(src, 'w342')} 1x, ${tmdbImage(src, 'w500')} 2x` };
}
