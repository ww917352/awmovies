// 24px stroke icons in currentColor, SF Symbols-ish weight.
import type { ReactNode } from 'react';

function icon(path: ReactNode, strokeWidth = 1.7) {
  return function Icon({ className = 'w-6 h-6' }: { className?: string }) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {path}
      </svg>
    );
  };
}

export const PinTabIcon = icon(
  <>
    <path d="M9 3.5h6l-1 6 3.5 3.5h-11L10 9.5z" />
    <path d="M12 13v7.5" />
  </>
);
export const TrophyIcon = icon(
  <>
    <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z" />
    <path d="M7.5 6H4.5a3 3 0 0 0 3.5 4M16.5 6h3a3 3 0 0 1-3.5 4" />
    <path d="M12 13.5V17M8.5 20h7l-.8-3h-5.4z" />
  </>
);
export const ListsIcon = icon(
  <>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </>
);
export const FilmIcon = icon(
  <>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M7.5 4v16M16.5 4v16M3.5 9h4M3.5 15h4M16.5 9h4M16.5 15h4" />
  </>
);
export const PersonIcon = icon(
  <>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </>
);
export const SearchIcon = icon(
  <>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20 20" />
  </>,
  2
);
export const ChevronLeft = icon(<path d="M15 5l-7 7 7 7" />, 2.2);
export const ChevronRight = icon(<path d="M9 5l7 7-7 7" />, 2.2);
export const CheckIcon = icon(<path d="M5 12.5l4.5 4.5L19 7.5" />, 2.6);
export const XIcon = icon(<path d="M6 6l12 12M18 6L6 18" />, 2);
