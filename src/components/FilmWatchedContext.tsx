'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type FilmMap = Record<number, boolean>;

type Ctx = {
  watchedMap: FilmMap;
  setWatched: (filmId: number, watched: boolean) => void;
  pinnedMap: FilmMap;
  setPinned: (filmId: number, pinned: boolean) => void;
  // Pinned films, newest pin first (pins made on this page lead).
  pinnedIds: number[];
  // Called after a film is marked watched; asks whether to unpin it if pinned.
  offerUnpin: (filmId: number, title: string) => void;
  lockWatched: boolean;
};

const WatchedContext = createContext<Ctx | null>(null);

export async function saveStatus(filmId: number, patch: Record<string, unknown>): Promise<boolean> {
  const res = await fetch(`/api/films/${filmId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => null);
  return !!res?.ok;
}

// Optimistic status saves for one film. Saves are sent one after another, so
// they land in the order they were made, and only the latest decides what a
// failure rolls back to: the last value the server accepted. So two quick
// taps can't leave the screen and the database disagreeing. `save` applies
// `next` straight away — call it from the event handler, not inside
// startTransition, or the optimistic update becomes low-priority and a quick
// second tap sees the old value. Resolves true when this save is the latest
// and it landed; the second value is true while any save is in flight.
export function useStatusSaver<T>(filmId: number, initial: T) {
  const confirmed = useRef(initial);
  const latest = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [inFlight, setInFlight] = useState(0);
  const save = useCallback(
    async (next: T, patch: Record<string, unknown>, apply: (value: T) => void): Promise<boolean> => {
      const mine = ++latest.current;
      apply(next);
      setInFlight((n) => n + 1);
      const request = queue.current.then(() => saveStatus(filmId, patch));
      queue.current = request;
      const ok = await request;
      setInFlight((n) => n - 1);
      if (ok) confirmed.current = next;
      if (mine !== latest.current) return false;
      if (!ok) apply(confirmed.current);
      return ok;
    },
    [filmId]
  );
  return [save, inFlight > 0] as const;
}

// Shared watched/pinned state for every film on a page, so the same film
// shown twice (or a progress bar) stays in sync. `lockWatched` is the user's
// "don't let me untick Watched" setting — see userSettings in schema.ts. It
// only applies to WatchedToggles, never the film page's own controls.
// `initialPinnedOrder` lists pinned films newest first, for pages that show
// them in order (the Pinned tab).
export function FilmWatchedProvider({
  initial,
  initialPinned = {},
  initialPinnedOrder = [],
  lockWatched = false,
  children,
}: {
  initial: FilmMap;
  initialPinned?: FilmMap;
  initialPinnedOrder?: number[];
  lockWatched?: boolean;
  children: ReactNode;
}) {
  const [watchedMap, setWatchedMap] = useState<FilmMap>(initial);
  const [pinnedMap, setPinnedMap] = useState<FilmMap>(initialPinned);
  // Higher = pinned more recently.
  const [pinRank, setPinRank] = useState<Record<number, number>>(() =>
    Object.fromEntries(initialPinnedOrder.map((id, i) => [id, initialPinnedOrder.length - i]))
  );
  const nextRank = useRef(initialPinnedOrder.length + 1);
  const [prompt, setPrompt] = useState<{ filmId: number; title: string } | null>(null);
  const pinnedRef = useRef(pinnedMap);
  useEffect(() => {
    pinnedRef.current = pinnedMap;
  }, [pinnedMap]);

  const setWatched = useCallback((filmId: number, watched: boolean) => {
    setWatchedMap((prev) => ({ ...prev, [filmId]: watched }));
  }, []);
  const setPinned = useCallback((filmId: number, pinned: boolean) => {
    setPinnedMap((prev) => ({ ...prev, [filmId]: pinned }));
    if (pinned) {
      const rank = nextRank.current++;
      setPinRank((prev) => ({ ...prev, [filmId]: rank }));
    }
  }, []);
  const offerUnpin = useCallback((filmId: number, title: string) => {
    if (pinnedRef.current[filmId]) setPrompt({ filmId, title });
  }, []);
  const pinnedIds = useMemo(
    () =>
      Object.entries(pinnedMap)
        .filter(([, pinned]) => pinned)
        .map(([id]) => Number(id))
        .sort((a, b) => (pinRank[b] ?? 0) - (pinRank[a] ?? 0)),
    [pinnedMap, pinRank]
  );

  return (
    <WatchedContext.Provider value={{ watchedMap, setWatched, pinnedMap, setPinned, pinnedIds, offerUnpin, lockWatched }}>
      {children}
      {prompt && (
        <UnpinPrompt
          title={prompt.title}
          onClose={() => setPrompt(null)}
          onUnpin={async () => {
            const { filmId } = prompt;
            setPrompt(null);
            setPinned(filmId, false);
            // Rolling back re-pins it, which moves it to the front; acceptable
            // for a failed save.
            if (!(await saveStatus(filmId, { pinned: false }))) setPinned(filmId, true);
          }}
        />
      )}
    </WatchedContext.Provider>
  );
}

function UnpinPrompt({ title, onClose, onUnpin }: { title: string; onClose: () => void; onUnpin: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="sheet"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div className="p-5 text-center">
        <p className="headline">Watched “{title}”</p>
        <p className="mt-1 text-[15px] text-label-2">Unpin it from Pinned?</p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <button
          onClick={() => ref.current?.close()}
          className="rounded-xl bg-fill py-3 text-[17px] font-medium"
        >
          Keep pinned
        </button>
        <button onClick={onUnpin} className="rounded-xl bg-tint py-3 text-[17px] font-semibold text-white dark:text-black">
          Unpin
        </button>
      </div>
    </dialog>
  );
}

// Falls back to `fallback` (the server-rendered initial value) when used
// outside a provider or before the film's id has been seen.
export function useFilmWatched(filmId: number, fallback: boolean) {
  const ctx = useContext(WatchedContext);
  const watched = ctx ? (ctx.watchedMap[filmId] ?? fallback) : fallback;
  const setWatched = (value: boolean) => ctx?.setWatched(filmId, value);
  return [watched, setWatched] as const;
}

export function useFilmPinned(filmId: number, fallback: boolean) {
  const ctx = useContext(WatchedContext);
  const pinned = ctx ? (ctx.pinnedMap[filmId] ?? fallback) : fallback;
  const setPinned = (value: boolean) => ctx?.setPinned(filmId, value);
  return [pinned, setPinned] as const;
}

export function useOfferUnpin() {
  return useContext(WatchedContext)?.offerUnpin ?? (() => {});
}

export function useLockWatched(): boolean {
  return useContext(WatchedContext)?.lockWatched ?? false;
}

// Reads the live maps so summary/progress UI stays in sync with individual
// toggles without a page refresh.
export function useWatchedMap(): FilmMap {
  return useContext(WatchedContext)?.watchedMap ?? {};
}

export function usePinnedIds(): number[] {
  return useContext(WatchedContext)?.pinnedIds ?? [];
}
