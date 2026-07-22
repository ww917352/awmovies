'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type WatchedMap = Record<number, boolean>;

const WatchedContext = createContext<{
  watchedMap: WatchedMap;
  setWatched: (filmId: number, watched: boolean) => void;
} | null>(null);

export function FilmWatchedProvider({ initial, children }: { initial: WatchedMap; children: ReactNode }) {
  const [watchedMap, setWatchedMap] = useState<WatchedMap>(initial);

  const setWatched = useCallback((filmId: number, watched: boolean) => {
    setWatchedMap((prev) => ({ ...prev, [filmId]: watched }));
  }, []);

  return <WatchedContext.Provider value={{ watchedMap, setWatched }}>{children}</WatchedContext.Provider>;
}

// Falls back to `fallback` (the server-rendered initial value) when used
// outside a provider or before the film's id has been seen, so callers don't
// need a provider on every page — only pages that can render the same film
// more than once at a time need to wrap themselves in one.
export function useFilmWatched(filmId: number, fallback: boolean) {
  const ctx = useContext(WatchedContext);
  const watched = ctx ? (ctx.watchedMap[filmId] ?? fallback) : fallback;
  const setWatched = (value: boolean) => ctx?.setWatched(filmId, value);
  return [watched, setWatched] as const;
}
