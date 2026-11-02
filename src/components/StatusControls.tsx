'use client';

import { useState } from 'react';
import PinButton from './PinButton';
import { FilmWatchedProvider, useOfferUnpin, useStatusSaver } from './FilmWatchedContext';
import Chip from './ui/Chip';
import { CheckIcon } from './ui/icons';

type Status = {
  watched: boolean;
  ownedFormats: string[];
  digitalQuality: string | null;
  pinned: boolean;
};

const FORMATS = [
  { value: 'dvd', label: 'DVD' },
  { value: 'bluray', label: 'Blu-ray' },
  { value: 'digital', label: 'Digital' },
] as const;
const QUALITIES = ['sd', 'hd', '4k'] as const;

// The film page's controls: pin, watched, and the formats you own it in.
export default function StatusControls(props: { filmId: number; title: string; initialStatus: Status }) {
  const { filmId, initialStatus } = props;
  return (
    <FilmWatchedProvider initial={{ [filmId]: initialStatus.watched }} initialPinned={{ [filmId]: initialStatus.pinned }}>
      <Controls {...props} />
    </FilmWatchedProvider>
  );
}

function Controls({ filmId, title, initialStatus }: { filmId: number; title: string; initialStatus: Status }) {
  const [status, setStatus] = useState(initialStatus);
  const [save, isPending] = useStatusSaver(filmId, initialStatus);
  const offerUnpin = useOfferUnpin();

  function persist(next: Status, patch: Partial<Status>) {
    // Rolls back if the write didn't land (e.g. the session expired).
    save(next, patch, setStatus).then((ok) => ok && patch.watched && offerUnpin(filmId, title));
  }

  function toggleFormat(format: string) {
    const has = status.ownedFormats.includes(format);
    const ownedFormats = has ? status.ownedFormats.filter((f) => f !== format) : [...status.ownedFormats, format];
    const digitalQuality = ownedFormats.includes('digital') ? status.digitalQuality : null;
    persist({ ...status, ownedFormats, digitalQuality }, { ownedFormats, digitalQuality });
  }

  return (
    <div className={`flex flex-col gap-4 ${isPending ? 'opacity-80' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => persist({ ...status, watched: !status.watched }, { watched: !status.watched })}
          aria-pressed={status.watched}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
            status.watched ? 'bg-ok-bright text-white' : 'bg-fill text-label hover:bg-fill-2'
          }`}
        >
          <CheckIcon className="w-4 h-4" />
          {status.watched ? 'Watched' : 'Mark as watched'}
        </button>
        <PinButton filmId={filmId} initialPinned={initialStatus.pinned} variant="pill" />
      </div>

      <div>
        <p className="mb-1.5 text-[13px] text-label-2">I own it on</p>
        <div className="flex flex-wrap items-center gap-2">
          {FORMATS.map((f) => (
            <Chip key={f.value} on={status.ownedFormats.includes(f.value)} onClick={() => toggleFormat(f.value)}>
              {f.label}
            </Chip>
          ))}
          {status.ownedFormats.includes('digital') && (
            <div className="flex rounded-full bg-fill p-0.5" role="group" aria-label="Digital quality">
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    const digitalQuality = status.digitalQuality === q ? null : q;
                    persist({ ...status, digitalQuality }, { digitalQuality });
                  }}
                  aria-pressed={status.digitalQuality === q}
                  className={`rounded-full px-3 py-1 text-[13px] font-semibold ${
                    status.digitalQuality === q ? 'bg-card shadow-card' : 'text-label-2'
                  }`}
                >
                  {q.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
