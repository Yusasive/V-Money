/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        lota: ["Lota Grotesque", "sans-serif"],
      },
      colors: {
        primary: "#45d345",
        secondary: "#0063ff",
      },
    },
  },
  plugins: [],
};
