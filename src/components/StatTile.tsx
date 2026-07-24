const BAR_COLOR = {
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
} as const;

export default function StatTile({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: keyof typeof BAR_COLOR;
}) {
  const pct = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-card/40 px-4 py-3">
      <p className="text-sm text-neutral-500 mb-1">{label}</p>
      <p className="text-xl font-semibold mb-2">
        {value} <span className="text-neutral-500 font-normal text-base">of {total} ({pct}%)</span>
      </p>
      <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className={`h-full rounded-full ${BAR_COLOR[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
