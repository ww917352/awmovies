// A film poster at 2:3, or a tinted placeholder with the title for the few
// films that have none. Size it with `className` (e.g. "w-12").
export default function Poster({
  src,
  title,
  className = '',
  rounded = 'rounded-md',
}: {
  src: string | null;
  title: string;
  className?: string;
  rounded?: string;
}) {
  const frame = `relative block aspect-[2/3] shrink-0 overflow-hidden bg-fill ${rounded} ${className}`;
  if (!src) {
    let hue = 0;
    for (const ch of title) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return (
      <span
        className={`${frame} grid place-items-center p-1.5 text-center text-[11px] font-semibold leading-tight`}
        style={{ background: `hsl(${hue} 25% 38%)`, color: `hsl(${hue} 30% 92%)` }}
        aria-hidden
      >
        {title}
      </span>
    );
  }
  return (
    <span className={frame}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className={`pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 ${rounded}`} />
    </span>
  );
}
