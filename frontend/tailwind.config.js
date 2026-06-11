/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#1a1a1a',
        'sidebar-hover': '#2a2a2a',
        primary: {
          50: '#fff1f0',
          100: '#ffe0de',
          200: '#ffc5c1',
          300: '#ff9d97',
          400: '#ff6b63',
          500: '#e8574e',
          600: '#d94840',
          700: '#b63530',
          800: '#962e2a',
          900: '#7c2b27',
        },
        dark: {
          100: '#2a2a2a',
          200: '#222222',
          300: '#1a1a1a',
          400: '#141414',
          500: '#0f0f0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'heading': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};
