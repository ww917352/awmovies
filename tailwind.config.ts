import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f1115',
        card: '#171a21',
      },
    },
  },
  darkMode: 'media',
  plugins: [],
};

export default config;
