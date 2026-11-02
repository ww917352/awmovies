import type { MetadataRoute } from 'next';

// Lets "Add to Home Screen" on iPhone/iPad open Palmarès full-screen with the trophy icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Palmarès',
    short_name: 'Palmarès',
    description: 'Oscar, Cannes, Venice and Berlin top award winners.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    icons: [{ src: '/logo.png', sizes: '512x512', type: 'image/png' }],
  };
}
