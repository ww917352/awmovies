import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Award-Winning Movies',
  description: 'A catalog of Oscar, Cannes, Venice and Berlin top award winners.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
