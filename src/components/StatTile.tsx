export default function StatTile({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-card px-4 py-3.5">
      <p className="text-[13px] text-label-2">{label}</p>
      <p className="mt-0.5 mb-2.5 flex items-baseline gap-1.5">
        <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums">{value}</span>
        <span className="text-[15px] text-label-2">
          of {total} · {pct}%
        </span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-fill">
        <div className="h-full rounded-full bg-ok-bright" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
