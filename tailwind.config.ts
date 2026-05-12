import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        px: {
          red:     '#c0392b',
          'red-b': '#e74c3c',
          'red-d': '#96281b',
          gold:    '#f39c12',
          'gold-l':'#f5b942',
          black:   '#0a0a0a',
          dark:    '#111111',
          surface: '#1a1a1a',
          surface2:'#222222',
          border:  '#2a2a2a',
          muted:   '#888888',
          text:    '#f0f0f0',
        },
      },
      fontFamily: {
        title: ['Inter', 'system-ui', 'sans-serif'],
        body:  ['Open Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'px-hero': 'linear-gradient(to right, #0a0a0a 30%, transparent 100%)',
      },
    },
  },
  plugins: [],
}
export default config
