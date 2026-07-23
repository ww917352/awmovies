import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFilmById } from '@/db/queries';
import { getCurrentUser } from '@/lib/auth';
import StatusControls from '@/components/StatusControls';

export const dynamic = 'force-dynamic';

export default async function FilmDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { back?: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const user = await getCurrentUser();
  const film = await getFilmById(id, user?.id ?? null);
  if (!film) notFound();

  // Only accept a same-site relative path — searchParams is attacker-controlled,
  // and an absolute/protocol-relative URL here would make this an open redirect.
  const backHref =
    searchParams.back && searchParams.back.startsWith('/') && !searchParams.back.startsWith('//')
      ? searchParams.back
      : '/';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href={backHref} className="text-sm text-sky-400 hover:underline">
        &larr; Back to all films
      </Link>

      <div
        className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-4 mt-3 [grid-template-areas:'poster_title'_'rest_rest'] sm:[grid-template-areas:'poster_title'_'poster_rest']"
      >
        {film.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={film.posterUrl}
            alt={`${film.title} poster`}
            className="[grid-area:poster] w-40 sm:w-48 shrink-0 rounded-lg border border-neutral-800 self-start"
          />
        )}

        <div className="[grid-area:title] min-w-0 self-start">
          <h1 className="text-3xl font-bold">{film.title}</h1>
          {film.originalTitle && film.originalTitle !== film.title && (
            <p className="text-neutral-400 italic">{film.originalTitle}</p>
          )}
          <p className="text-neutral-400">{film.releaseYear}</p>
        </div>

        <div className="[grid-area:rest] min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {film.wins.map((w, i) => (
              <span
                key={i}
                className="text-xs bg-neutral-800 border border-neutral-700 rounded-full px-2 py-0.5 text-neutral-300"
              >
                {w.awardName} &mdash; {w.editionLabel ?? w.year}
              </span>
            ))}
          </div>

          <dl className="space-y-2 text-sm mb-4">
            {film.directors.length > 0 && (
              <div>
                <dt className="text-neutral-500 inline">Director: </dt>
                <dd className="inline">{film.directors.join(', ')}</dd>
              </div>
            )}
            {film.studios.length > 0 && (
              <div>
                <dt className="text-neutral-500 inline">Studio: </dt>
                <dd className="inline">{film.studios.join(', ')}</dd>
              </div>
            )}
            {film.mainCast.length > 0 && (
              <div>
                <dt className="text-neutral-500 inline">Starring: </dt>
                <dd className="inline">{film.mainCast.join(', ')}</dd>
              </div>
            )}
          </dl>

          <div className="flex gap-4 mb-6">
            {film.wikiUrl && (
              <a href={film.wikiUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                Wikipedia
              </a>
            )}
            {film.letterboxdUrl && (
              <a
                href={film.letterboxdUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Letterboxd{film.letterboxdUnverified ? ' (unverified link)' : ''}
              </a>
            )}
            {film.appleTvUrl && (
              <a href={film.appleTvUrl} target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">
                Apple TV
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-neutral-800 rounded-lg p-4 mb-6">
        {user ? (
          <StatusControls filmId={film.id} initialStatus={film.status} />
        ) : (
          <p className="text-sm text-neutral-500">
            <Link href="/login" className="text-sky-400 hover:underline">
              Log in
            </Link>{' '}
            to track watched/owned status.
          </p>
        )}
      </div>

      {film.plotSummary && <p className="text-sm text-neutral-300 leading-relaxed">{film.plotSummary}</p>}
    </main>
  );
}
