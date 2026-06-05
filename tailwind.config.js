/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: 'var(--surf)',
        surface2: 'var(--surf2)',
        surface3: 'var(--surf3)',
        border: 'var(--b)',
        tx: 'var(--tx)',
        tx2: 'var(--tx2)',
        tx3: 'var(--tx3)',
        bg: 'var(--bg)',
      },
    },
  },
  plugins: [],
};
