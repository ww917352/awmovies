// The bar a page's search and filters sit in, pinned under the top nav.
export default function StickyToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="sticky z-20 -mx-4 mb-4 flex flex-col gap-2 bg-bg/90 px-4 py-2 backdrop-blur-xl sm:-mx-2 sm:px-2"
      style={{ top: 'var(--sticky-top)' }}
    >
      {children}
    </div>
  );
}
