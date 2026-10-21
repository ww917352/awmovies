import { AWARD_ABBR } from '@/lib/format';

// One award win as shown in a FilmRow label, e.g. "1976 Oscar · Best Picture"
// (the year is left out on the year page, where it's the section heading).
export default function WinLabel({
  year,
  awardSlug,
  awardName,
}: {
  year?: number;
  awardSlug: string;
  awardName: string;
}) {
  return (
    <span>
      {year !== undefined && (
        <span className="text-neutral-700 dark:text-neutral-300 font-semibold mr-1.5">{year}</span>
      )}
      {AWARD_ABBR[awardSlug] ?? awardName}
    </span>
  );
}
