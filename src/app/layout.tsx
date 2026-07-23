import type { Metadata } from 'next';
import './globals.css';
import ThemeScript from '@/components/ThemeScript';
import ThemeSync from '@/components/ThemeSync';

export const metadata: Metadata = {
  title: 'Award-Winning Movies',
  description: 'A catalog of Oscar, Cannes, Venice and Berlin top award winners.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
