import { AWARD_ABBR } from '@/lib/format';

// One award win as shown in a FilmRow label, e.g. "1976 · Oscar · Best Picture".
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
      {year !== undefined && <span className="font-semibold text-tint">{year} </span>}
      {AWARD_ABBR[awardSlug] ?? awardName}
    </span>
  );
}
