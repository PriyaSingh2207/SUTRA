/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          950: '#070b14',
          900: '#0c1527',
          800: '#14223d',
          700: '#1e335a',
          500: '#325796',
          400: '#4c78c2',
        }
      }
    },
  },
  plugins: [],
}
