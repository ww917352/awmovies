'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type FilmMap = Record<number, boolean>;

type Ctx = {
  watchedMap: FilmMap;
  setWatched: (filmId: number, watched: boolean) => void;
  pinnedMap: FilmMap;
  setPinned: (filmId: number, pinned: boolean) => void;
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

// Shared watched/pinned state for every film on a page, so the same film
// shown twice (or a progress bar) stays in sync. `lockWatched` is the user's
// "don't let me untick Watched" setting — see userSettings in schema.ts. It
// only applies to WatchedToggles, never the film page's own controls.
export function FilmWatchedProvider({
  initial,
  initialPinned = {},
  lockWatched = false,
  children,
}: {
  initial: FilmMap;
  initialPinned?: FilmMap;
  lockWatched?: boolean;
  children: ReactNode;
}) {
  const [watchedMap, setWatchedMap] = useState<FilmMap>(initial);
  const [pinnedMap, setPinnedMap] = useState<FilmMap>(initialPinned);
  const [prompt, setPrompt] = useState<{ filmId: number; title: string } | null>(null);
  const pinnedRef = useRef(pinnedMap);
  pinnedRef.current = pinnedMap;

  const setWatched = useCallback((filmId: number, watched: boolean) => {
    setWatchedMap((prev) => ({ ...prev, [filmId]: watched }));
  }, []);
  const setPinned = useCallback((filmId: number, pinned: boolean) => {
    setPinnedMap((prev) => ({ ...prev, [filmId]: pinned }));
  }, []);
  const offerUnpin = useCallback((filmId: number, title: string) => {
    if (pinnedRef.current[filmId]) setPrompt({ filmId, title });
  }, []);

  return (
    <WatchedContext.Provider value={{ watchedMap, setWatched, pinnedMap, setPinned, offerUnpin, lockWatched }}>
      {children}
      {prompt && (
        <UnpinPrompt
          title={prompt.title}
          onClose={() => setPrompt(null)}
          onUnpin={async () => {
            const { filmId } = prompt;
            setPrompt(null);
            setPinned(filmId, false);
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

export function usePinnedMap(): FilmMap {
  return useContext(WatchedContext)?.pinnedMap ?? {};
}
