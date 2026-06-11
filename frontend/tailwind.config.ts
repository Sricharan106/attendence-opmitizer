/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This ensures everything under src is parsed!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
