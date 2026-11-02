// A film poster at 2:3, or a tinted placeholder with the title. Size it with
// `className` (e.g. "w-12"), and say how big it shows with `size` ('sm' up
// to ~80px wide, 'md' for cards and the film page) so the right TMDB size is
// requested. Only TMDB images are shown — their API terms permit it with
// attribution (see TmdbAttribution); any other URL gets the placeholder.
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
  if (!src || !isTmdbImage(src)) {
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

export function isTmdbImage(url: string): boolean {
  return TMDB_IMAGE.test(url);
}

// TMDB serves fixed widths: swap the size segment for the one we need.
export function tmdbImage(url: string, width: 'w92' | 'w185' | 'w342' | 'w500'): string {
  return url.replace(TMDB_IMAGE, `https://image.tmdb.org/t/p/${width}/`);
}

function imageSources(src: string, size: 'sm' | 'md') {
  return size === 'sm'
    ? { src: tmdbImage(src, 'w92'), srcSet: `${tmdbImage(src, 'w92')} 1x, ${tmdbImage(src, 'w185')} 2x` }
    : { src: tmdbImage(src, 'w342'), srcSet: `${tmdbImage(src, 'w342')} 1x, ${tmdbImage(src, 'w500')} 2x` };
}
