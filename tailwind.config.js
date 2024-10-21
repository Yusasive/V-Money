/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        lota: ["Lota Grotesque", "sans-serif"],
      },
      colors: {
        primary: "#1E90FF",
        secondary: "#FF8C00#FF8C00",
      },
    },
  },
  plugins: [],
};
