/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sap: {
          bg: "#f5f6f7",
          header: "#354a5f",
          primary: "#0a6ed1",
          card: "#ffffff",
          text: "#32363a",
        }
      }
    },
  },
  plugins: [],
}