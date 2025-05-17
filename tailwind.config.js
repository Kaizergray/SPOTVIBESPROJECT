/ @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.php',
    './src/**/*.{html,js,php}',
  ],
  theme: {
    extend: {
      colors: {
        blueHeader: '#3A6D8C',
        sandFooter: '#EAD8B1'
      }
    },
  },
  plugins: [],
}