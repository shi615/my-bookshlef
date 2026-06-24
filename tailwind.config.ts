import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm Library palette
        paper: '#f7f2e9', // page background — aged paper
        parchment: '#fdfbf6', // surfaces / cards
        ink: '#2b2622', // primary text — sumi
        muted: '#7a7065', // secondary text
        line: '#e7ddcb', // warm borders / dividers
        leather: {
          DEFAULT: '#8b3a2f', // spine red-brown (primary accent)
          dark: '#6f2c23',
          light: '#a8473a',
        },
        brass: {
          DEFAULT: '#b8893b', // gold accent
          light: '#d9b36a',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        book: '0 1px 2px rgba(43, 38, 34, 0.06), 0 6px 16px rgba(43, 38, 34, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
