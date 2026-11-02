import type { Director } from '@/db/queries';

export function lifeYears(director: Director): string {
  return director.deathYear === null ? `Born ${director.birthYear}` : `${director.birthYear}–${director.deathYear}`;
}

// The top of a director's filmography list: photo, name, life years and links.
export default function DirectorHeader({ director }: { director: Director }) {
  return (
    <div className="flex items-center gap-4">
      {director.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={director.photoUrl}
          alt={director.name}
          referrerPolicy="no-referrer"
          className="h-24 w-24 shrink-0 rounded-full object-cover object-top shadow-card sm:h-28 sm:w-28"
        />
      )}
      <div className="min-w-0">
        <h1 className="large-title">{director.name}</h1>
        <p className="text-label-2">{lifeYears(director)}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 text-[15px]">
          {director.wikiUrl && (
            <a href={director.wikiUrl} target="_blank" rel="noreferrer" className="text-tint hover:underline">
              Wikipedia
            </a>
          )}
          {director.letterboxdUrl && (
            <a href={director.letterboxdUrl} target="_blank" rel="noreferrer" className="text-tint hover:underline">
              Letterboxd
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
