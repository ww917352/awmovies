export type Theme = 'light' | 'dark';

// Daylight hours get the light theme, everything else gets dark.
export function themeForHour(hour: number): Theme {
  return hour >= 7 && hour < 19 ? 'light' : 'dark';
}
