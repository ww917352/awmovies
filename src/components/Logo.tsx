// The sketch-style trophy from public/logo.svg, drawn in currentColor and
// without its paper background so it sits on any theme. `idPrefix` keeps the
// filter/clip ids unique when the logo appears twice on one page.
export default function Logo({ className = '', idPrefix = 'logo' }: { className?: string; idPrefix?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const outline =
    'M160 112 C160 214 200 268 238 290 L274 290 C312 268 352 214 352 112 Z M150 104 Q256 98 362 104 M164 132 C104 124 92 214 186 244 M162 150 C120 150 116 206 180 228 M348 132 C408 124 420 214 326 244 M350 150 C392 150 396 206 332 228 M244 290 L240 336 M268 290 L272 336 M230 300 Q256 312 282 300 M214 336 L298 336 L306 366 L206 366 Z M176 366 L336 366 L336 418 L176 418 Z M256.0,142.0L265.4,167.1L292.1,168.3L271.2,184.9L278.3,210.7L256.0,196.0L233.7,210.7L240.8,184.9L219.9,168.3L246.6,167.1Z';
  const bowlHatch = Array.from({ length: 36 }, (_, i) => `M${196 + i * 9} 100 L${276 + i * 9} 300`).join(' ');
  const baseHatch = Array.from({ length: 12 }, (_, i) => `M${250 + i * 8} 336 L${268 + i * 8} 366`).join(' ');
  const filmHoles = Array.from({ length: 7 }, (_, i) => {
    const x = 186 + i * 20;
    return `M${x} 373 h10 v7 h-10 Z M${x} 404 h10 v7 h-10 Z`;
  }).join(' ');

  return (
    <svg viewBox="80 50 352 410" className={className} aria-hidden>
      <defs>
        <filter id={id('rough')} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
        <filter id={id('rough2')} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="21" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
        <clipPath id={id('bowl')}>
          <path d="M160 112 C160 214 200 268 238 290 L274 290 C312 268 352 214 352 112 Z" />
        </clipPath>
        <clipPath id={id('right')}>
          <rect x="304" y="0" width="230" height="512" />
        </clipPath>
        <clipPath id={id('base')}>
          <path d="M214 336 L298 336 L306 366 L206 366 Z" />
        </clipPath>
      </defs>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <g clipPath={url('bowl')}>
          <g clipPath={url('right')} filter={url('rough2')}>
            <path d={bowlHatch} strokeWidth="3" />
          </g>
        </g>
        <g clipPath={url('base')}>
          <g clipPath={url('right')} filter={url('rough2')}>
            <path d={baseHatch} strokeWidth="3" />
          </g>
        </g>
        <g filter={url('rough')}>
          <path d={outline} strokeWidth="9" />
        </g>
        <g filter={url('rough2')} transform="translate(3 -2) rotate(0.6 256 256)" opacity="0.75">
          <path d={outline} strokeWidth="3.5" />
        </g>
        <g filter={url('rough')}>
          <path d={filmHoles} strokeWidth="3.5" fill="currentColor" />
        </g>
        <g filter={url('rough2')} strokeWidth="5">
          <path d="M118 74 v28 M104 88 h28" />
          <path d="M396 62 v20 M386 72 h20" />
          <path d="M126 432 Q256 446 392 428" strokeWidth="6" />
          <path d="M150 446 Q256 456 360 444" strokeWidth="3" />
        </g>
      </g>
    </svg>
  );
}
