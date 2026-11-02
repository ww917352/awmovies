import type { CSSProperties } from 'react';

// Style for a `grid-cols-[repeat(var(--cols),minmax(0,1fr))]` grid: one
// column per item, but never fewer than `min` so items keep their size.
export function gridCols(count: number, min = 5): CSSProperties {
  return { '--cols': Math.max(min, count) } as CSSProperties;
}
