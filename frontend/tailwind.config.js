/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0d1117',
          800: '#161b22',
          700: '#21262d',
          600: '#30363d',
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F0',
          200: '#F5EFE4',
          300: '#EAE1D2',
          400: '#DDD2BF',
          card: '#FFFDF9',
          border: '#E8E0D1',
          text: '#2D2823',
          muted: '#736B63',
        },
        accent: {
          blue: '#58a6ff',
          green: '#3fb950',
          purple: '#bc8cff',
          orange: '#d29922'
        }
      }
    },
  },
  plugins: [],
}
