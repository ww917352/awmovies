import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFilmById, getListMemberships } from '@/db/queries';
import { getCurrentUser, requireUpToDatePassword } from '@/lib/auth';
import { toSafeRelativePath } from '@/lib/safe-path';
import StatusControls from '@/components/StatusControls';
import Poster, { imageSource } from '@/components/Poster';
import { ChevronLeft } from '@/components/ui/icons';
import { AWARD_ABBR } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function FilmDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const user = await getCurrentUser();
  requireUpToDatePassword(user);
  const [film, memberships] = await Promise.all([getFilmById(id, user?.id ?? null), getListMemberships(id)]);
  if (!film) notFound();
  const filmLists = memberships[film.id] ?? [];

  const { back } = await searchParams;
  const backHref = toSafeRelativePath(back);

  const posterSource = film.posterUrl ? imageSource(film.posterUrl) : null;
  const facts = [
    { label: film.directors.length > 1 ? 'Directors' : 'Director', value: film.directors.join(', ') },
    { label: 'Studio', value: film.studios.join(', ') },
    { label: 'Starring', value: film.mainCast.join(', ') },
  ].filter((f) => f.value);
  const links = [
    { href: film.wikiUrl, label: 'Wikipedia' },
    { href: film.letterboxdUrl, label: film.letterboxdUnverified ? 'Letterboxd (unverified)' : 'Letterboxd' },
    { href: film.appleTvUrl, label: 'Apple TV' },
  ].filter((l): l is { href: string; label: string } => !!l.href);

  return (
    <div className="page">
      <Link href={backHref} className="mb-4 inline-flex items-center gap-0.5 text-[17px] text-tint">
        <ChevronLeft className="w-5 h-5 -ml-1" />
        Back
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
        <div className="mx-auto w-[min(62vw,260px)] shrink-0 md:mx-0 md:w-64 lg:w-72">
          <Poster src={film.posterUrl} title={film.title} size="md" className="w-full shadow-card" rounded="rounded-xl" />
          {posterSource && (
            <p className="mt-2 text-center text-[11px] text-label-3">
              Poster:{' '}
              <a href={posterSource.href} target="_blank" rel="noreferrer" className="hover:underline">
                {posterSource.name}
              </a>
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="large-title text-center md:text-left">{film.title}</h1>
          {film.originalTitle && film.originalTitle !== film.title && (
            <p className="mt-0.5 text-center text-[17px] italic text-label-2 md:text-left">{film.originalTitle}</p>
          )}
          <p className="mt-1 text-center text-[15px] text-label-2 md:text-left">
            {[film.releaseYear, film.directors.join(', ')].filter(Boolean).join(' · ')}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-1.5 md:justify-start">
            {film.wins.map((w, i) => (
              <Link
                key={i}
                href={`/awards/${w.year}`}
                prefetch={false}
                className="rounded-full bg-tint-soft px-3 py-1 text-[13px] font-semibold text-tint hover:underline"
              >
                {AWARD_ABBR[w.awardSlug] ?? w.awardName} · {w.editionLabel ?? w.year}
              </Link>
            ))}
            {filmLists.map((l) => (
              <Link
                key={l.slug}
                href={`/lists/${l.slug}`}
                prefetch={false}
                className="rounded-full bg-fill px-3 py-1 text-[13px] font-medium text-label hover:underline"
              >
                {l.title}
                {l.rank !== null && <> · No. {l.rank}</>}
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-card p-4">
            {user ? (
              <StatusControls filmId={film.id} title={film.title} initialStatus={film.status} />
            ) : (
              <p className="text-[15px] text-label-2">
                Palmarès is invite only.{' '}
                <Link href="/login" className="text-tint hover:underline">
                  Log in
                </Link>{' '}
                to pin films and track what you’ve watched and own.
              </p>
            )}
          </div>

          {film.plotSummary && <p className="mt-6 max-w-prose text-[16px] leading-relaxed">{film.plotSummary}</p>}

          {facts.length > 0 && (
            <dl className="mt-6 overflow-hidden rounded-2xl bg-card divide-y divide-sep">
              {facts.map((f) => (
                <div key={f.label} className="flex gap-4 px-4 py-2.5 text-[15px]">
                  <dt className="w-24 shrink-0 text-label-2">{f.label}</dt>
                  <dd className="min-w-0">{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-card px-4 py-2 text-[15px] font-medium text-tint shadow-card hover:bg-card-2"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
