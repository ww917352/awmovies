'use client';

import type { Ref } from 'react';
import { SearchIcon, XIcon } from './icons';

// The rounded grey search field, iOS-style, with its own clear button.
export default function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ref?: Ref<HTMLInputElement>;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl bg-fill px-3 py-2 text-label-2 focus-within:ring-2 focus-within:ring-tint/40">
      <SearchIcon className="w-[18px] h-[18px] shrink-0" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent text-label outline-none placeholder:text-label-2 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="grid h-5 w-5 place-items-center rounded-full bg-label-3 text-card"
          aria-label="Clear search"
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </label>
  );
}

// The bar a page's search and filters sit in, pinned under the top nav.
export function StickyToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="sticky z-20 -mx-4 mb-4 flex flex-col gap-2 bg-bg/90 px-4 py-2 backdrop-blur-xl sm:-mx-2 sm:px-2"
      style={{ top: 'var(--sticky-top)' }}
    >
      {children}
    </div>
  );
}
