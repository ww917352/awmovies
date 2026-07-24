'use client';

import { useEffect, useState } from 'react';
import { themeForHour } from '@/lib/theme';

type Override = 'light' | 'dark' | null;

const OPTIONS: { value: Override; label: string }[] = [
  { value: null, label: 'Automatic' },
  { value: 'light', label: 'Always light' },
  { value: 'dark', label: 'Always dark' },
];

export default function ThemeSettings() {
  const [override, setOverride] = useState<Override>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme-override');
    setOverride(stored === 'light' || stored === 'dark' ? stored : null);
  }, []);

  function apply(next: Override) {
    setOverride(next);
    if (next) {
      localStorage.setItem('theme-override', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    } else {
      localStorage.removeItem('theme-override');
      document.documentElement.classList.toggle('dark', themeForHour(new Date().getHours()) === 'dark');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => (
        <label key={opt.label} className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="radio"
            name="theme"
            checked={override === opt.value}
            onChange={() => apply(opt.value)}
            className="accent-emerald-500"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
