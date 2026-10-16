/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        laranja: {
          50: "#FFF4F0",
          100: "#FFE4DA",
          200: "#FFC6B3",
          400: "#F7743F",
          500: "#EE4D2D",
          600: "#D73211",
          700: "#B4280C",
        },
        marinho: {
          500: "#3B5BDB",
          800: "#1B2340",
          900: "#111729",
        },
        amarelo: "#FFC83D",
      },
      fontFamily: {
        sans: ['"Poppins"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,23,41,.04), 0 4px 16px rgba(17,23,41,.06)",
        cardHover: "0 4px 10px rgba(17,23,41,.06), 0 16px 32px rgba(238,77,45,.14)",
      },
      keyframes: {
        ticker: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        entrar: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "none" } },
        flutuar: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        ticker: "ticker 40s linear infinite",
        entrar: "entrar .35s ease-out both",
        flutuar: "flutuar 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
