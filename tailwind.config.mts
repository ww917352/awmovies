import type { Config } from 'tailwindcss';

// Colours, fonts and shadows live in globals.css (@theme) as CSS variables,
// so they switch with the .dark class without needing dark: variants.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  plugins: [],
};

export default config;
