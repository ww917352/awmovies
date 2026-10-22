import type { Director } from '@/db/queries';

export function lifeYears(director: Director): string {
  return director.deathYear === null ? `Born ${director.birthYear}` : `${director.birthYear}–${director.deathYear}`;
}

// The top of a director's filmography list: photo, name, life years and links.
export default function DirectorHeader({ director }: { director: Director }) {
  return (
    <div className="flex items-center gap-4 mt-3">
      {director.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={director.photoUrl}
          alt={director.name}
          referrerPolicy="no-referrer"
          className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-full object-cover object-top border border-neutral-200 dark:border-neutral-800"
        />
      )}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{director.name}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{lifeYears(director)}</p>
        <div className="flex flex-wrap gap-x-3 mt-1">
          {director.wikiUrl && (
            <a
              href={director.wikiUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
            >
              Wiki
            </a>
          )}
          {director.letterboxdUrl && (
            <a
              href={director.letterboxdUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Letterboxd
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
