import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFilmById } from '@/db/queries';
import StatusControls from '@/components/StatusControls';

export const dynamic = 'force-dynamic';

export default async function FilmDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const film = await getFilmById(id);
  if (!film) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="text-sm text-sky-400 hover:underline">
        &larr; Back to all films
      </Link>

      <div className="flex flex-col sm:flex-row gap-5 mt-3">
        {film.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={film.posterUrl}
            alt={`${film.title} poster`}
            className="w-40 sm:w-48 shrink-0 rounded-lg border border-neutral-800 self-start"
          />
        )}

        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{film.title}</h1>
          {film.originalTitle && film.originalTitle !== film.title && (
            <p className="text-neutral-400 italic">{film.originalTitle}</p>
          )}
          <p className="text-neutral-400 mb-4">{film.releaseYear}</p>

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
        <StatusControls filmId={film.id} initialStatus={film.status} />
      </div>

      {film.plotSummary && <p className="text-sm text-neutral-300 leading-relaxed">{film.plotSummary}</p>}
    </main>
  );
}
