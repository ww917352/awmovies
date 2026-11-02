'use client';

import { useEffect, useState } from 'react';
import { themeForHour } from '@/lib/theme';

type Override = 'light' | 'dark' | null;

const OPTIONS: { value: Override; label: string }[] = [
  { value: null, label: 'Automatic' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
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
    <div className="flex rounded-lg bg-fill p-0.5" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          role="radio"
          aria-checked={override === opt.value}
          onClick={() => apply(opt.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-[14px] font-medium ${
            override === opt.value ? 'bg-card shadow-card' : 'text-label-2'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
