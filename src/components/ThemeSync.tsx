'use client';

import { useEffect } from 'react';
import { themeForHour } from '@/lib/theme';

// Re-checks the clock every minute so a tab left open across the
// light/dark boundary (7am / 7pm) flips without a reload.
export default function ThemeSync() {
  useEffect(() => {
    function apply() {
      const override = localStorage.getItem('theme-override');
      const theme = override === 'light' || override === 'dark' ? override : themeForHour(new Date().getHours());
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
