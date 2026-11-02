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

  // Native radios (arrow keys move between them), drawn as a segmented control.
  return (
    <fieldset className="flex rounded-lg bg-fill p-0.5">
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map((opt) => (
        <label
          key={opt.label}
          className="flex-1 cursor-pointer rounded-md px-3 py-1.5 text-center text-[14px] font-medium text-label-2 has-[:checked]:bg-card has-[:checked]:text-label has-[:checked]:shadow-card has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tint"
        >
          <input
            type="radio"
            name="theme"
            className="sr-only"
            checked={override === opt.value}
            onChange={() => apply(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </fieldset>
  );
}
