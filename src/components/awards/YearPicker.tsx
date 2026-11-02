'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { AWARDS } from '@/lib/format';
import PinIcon from '../PinIcon';
import { XIcon } from '../ui/icons';

// Per award: 0 = not awarded, 1 = not (all) watched, 2 = watched.
export type PickerRow = { year: number; cells: (0 | 1 | 2)[] };

// Every year at a glance, a dot per award, grouped by decade — doubles as a
// map of what's left to watch. Decades flow into columns on wider screens.
export default function YearPicker({
  open,
  onClose,
  rows,
  currentYear,
  pinnedYear,
  showWatched,
}: {
  open: boolean;
  onClose: () => void;
  rows: PickerRow[];
  currentYear: number;
  pinnedYear: number | null;
  showWatched: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector(`[data-year="${currentYear}"]`)?.scrollIntoView({ block: 'center' });
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, currentYear]);

  const decades = new Map<number, PickerRow[]>();
  for (const row of rows) {
    const d = Math.floor(row.year / 10) * 10;
    decades.set(d, [...(decades.get(d) ?? []), row]);
  }

  return (
    <dialog
      ref={ref}
      className="sheet wide"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-sep px-5 py-3">
          <div>
            <h2 className="headline">All years</h2>
            {showWatched && (
              <p className="caption flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Dot state={2} /> watched
                </span>
                <span className="inline-flex items-center gap-1">
                  <Dot state={1} /> to watch
                </span>
                <span className="inline-flex items-center gap-1">
                  <Dot state={0} /> not awarded
                </span>
              </p>
            )}
          </div>
          <button
            onClick={() => ref.current?.close()}
            className="grid h-8 w-8 place-items-center rounded-full bg-fill text-label-2"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </header>

        <div className="overflow-y-auto px-3 py-4 sm:px-5">
          <div className="gap-6 sm:columns-2 lg:columns-3">
            {Array.from(decades, ([decade, decadeRows]) => (
              <section key={decade} className="mb-5 break-inside-avoid">
                <div className="mb-1 flex items-end justify-between px-2">
                  <h3 className="text-[13px] font-semibold text-label-2">{decade}s</h3>
                  <div className="flex gap-1">
                    {AWARDS.map((a) => (
                      <span key={a.slug} className="w-6 text-center text-[9px] font-medium uppercase text-label-3">
                        {a.short.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl bg-card-2">
                  {decadeRows.map((row) => {
                    const isCurrent = row.year === currentYear;
                    return (
                      <Link
                        key={row.year}
                        href={`/awards/${row.year}`}
                        data-year={row.year}
                        onClick={() => ref.current?.close()}
                        className={`flex items-center justify-between px-2 py-1.5 ${
                          isCurrent ? 'bg-tint-soft' : 'hover:bg-fill'
                        }`}
                      >
                        <span
                          className={`flex items-center gap-1.5 text-[15px] tabular-nums ${
                            isCurrent ? 'font-bold text-tint' : 'font-medium'
                          }`}
                        >
                          {row.year}
                          {row.year === pinnedYear && <PinIcon filled className="w-3.5 h-3.5 text-tint" />}
                        </span>
                        <span className="flex gap-1">
                          {row.cells.map((c, i) => (
                            <span key={i} className="grid w-6 place-items-center">
                              <Dot state={showWatched ? c : c && 1} />
                            </span>
                          ))}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </dialog>
  );
}

function Dot({ state }: { state: 0 | 1 | 2 }) {
  if (state === 2) return <span className="inline-block h-2.5 w-2.5 rounded-full bg-ok-bright" />;
  if (state === 1) return <span className="inline-block h-2.5 w-2.5 rounded-full ring-[1.5px] ring-inset ring-label-3" />;
  return <span className="inline-block h-[2px] w-2 rounded-full bg-label-3 opacity-50" />;
}
