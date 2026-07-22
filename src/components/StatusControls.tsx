'use client';

import { useState, useTransition } from 'react';

type Status = {
  watched: boolean;
  ownedFormats: string[];
  digitalQuality: string | null;
};

const FORMATS = ['dvd', 'bluray', 'digital'] as const;
const QUALITIES = ['sd', 'hd', '4k'] as const;

export default function StatusControls({
  filmId,
  initialStatus,
}: {
  filmId: number;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function persist(next: Status) {
    setStatus(next);
    startTransition(async () => {
      await fetch(`/api/films/${filmId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    });
  }

  function toggleWatched() {
    persist({ ...status, watched: !status.watched });
  }

  function toggleFormat(format: string) {
    const has = status.ownedFormats.includes(format);
    const ownedFormats = has
      ? status.ownedFormats.filter((f) => f !== format)
      : [...status.ownedFormats, format];
    const digitalQuality = ownedFormats.includes('digital') ? status.digitalQuality : null;
    persist({ ...status, ownedFormats, digitalQuality });
  }

  function setQuality(q: string) {
    persist({ ...status, digitalQuality: q || null });
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 text-sm ${isPending ? 'opacity-60' : ''}`}>
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input type="checkbox" checked={status.watched} onChange={toggleWatched} className="accent-emerald-500" />
        Watched
      </label>

      <div className="flex items-center gap-2">
        <span className="text-neutral-400">Owned:</span>
        {FORMATS.map((format) => (
          <label key={format} className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={status.ownedFormats.includes(format)}
              onChange={() => toggleFormat(format)}
              className="accent-sky-500"
            />
            {format === 'dvd' ? 'DVD' : format === 'bluray' ? 'Blu-ray' : 'Digital'}
          </label>
        ))}
      </div>

      {status.ownedFormats.includes('digital') && (
        <select
          value={status.digitalQuality ?? ''}
          onChange={(e) => setQuality(e.target.value)}
          className="bg-card border border-neutral-700 rounded px-1.5 py-0.5 text-xs"
        >
          <option value="">Quality?</option>
          {QUALITIES.map((q) => (
            <option key={q} value={q}>
              {q.toUpperCase()}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
