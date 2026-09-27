/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf5',
          100: '#d7fae6',
          500: '#10b981',
          600: '#00a859',
          700: '#008a49',
        },
      },
    },
  },
  plugins: [],
}
