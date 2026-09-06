/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tracker: {
          bg: '#000000',
          panel: '#0a0a0a',
          border: '#2a2a2a',
          orange: '#ff6600',
          text: '#eeeeee',
          textMuted: '#888888'
        },
        cockpit: {
          bg: '#121212',
          surface: '#1a1a1a',
          border: '#ff6600',
          text: '#ffffff',
          display: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['"Share Tech Mono"', 'monospace'],
        display: ['"Audiowide"', 'cursive', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(255, 102, 0, 0.35)',
        'glow-lg': '0 0 25px rgba(255, 102, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
