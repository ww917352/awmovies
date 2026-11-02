// A pill-shaped toggle button, e.g. a filter or a format you own.
export default function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${
        on ? 'bg-label text-bg' : 'bg-fill text-label hover:bg-fill-2'
      }`}
    >
      {children}
    </button>
  );
}
