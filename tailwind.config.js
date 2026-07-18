/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Ador Noirit"', 'sans-serif'],
        bengali: ['"Ador Noirit"', 'sans-serif'],
        alinur: ['"Ador Noirit"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
