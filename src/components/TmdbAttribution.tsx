// The notice TMDB's API terms ask apps that show its images to display.
export default function TmdbAttribution({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[12px] leading-snug text-label-2 ${className}`}>
      Posters and photos from{' '}
      <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="text-tint hover:underline">
        TMDB
      </a>
      . This product uses the TMDB API but is not endorsed or certified by TMDB.
    </p>
  );
}
