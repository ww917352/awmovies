export default function PinIcon({ filled, className = 'w-6 h-6' }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g transform="rotate(-40 12 12)">
          <rect x="9" y="3" width="6" height="8.5" rx="3" fill="currentColor" stroke="none" />
          <line x1="12" y1="12" x2="12" y2="20" strokeWidth={1.8} />
          <circle cx="12" cy="20.4" r="1" fill="currentColor" stroke="none" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="8.5" rx="3" />
      <line x1="12" y1="12" x2="12" y2="19.5" />
    </svg>
  );
}
