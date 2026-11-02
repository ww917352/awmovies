import type { MetadataRoute } from 'next';

// Palmarès is a private, invite-only app: ask every crawler to stay out.
// The noindex meta tag (layout.tsx) and X-Robots-Tag header (next.config.js)
// keep pages out of search results even if a crawler ignores this or finds
// a link elsewhere.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}
