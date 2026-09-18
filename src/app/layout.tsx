import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import ThemeScript from '@/components/ThemeScript';
import ThemeSync from '@/components/ThemeSync';

export const metadata: Metadata = {
  title: 'Award-Winning Movies',
  description: 'A catalog of Oscar, Cannes, Venice and Berlin top award winners.',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Set by middleware.ts on the CSP header (script-src 'nonce-...') — our
  // inline theme script needs the same nonce to run under that policy.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
