/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Rapidual brand — dark navy base + orange accent (from the deck).
        navy: {
          950: "#070C1C",
          900: "#0A1124", // app background
          800: "#0D1530",
          700: "#131C3A", // surface / cards
          600: "#1B2748", // elevated surface
          500: "#27365F",
          400: "#3A4C7A",
        },
        orange: {
          DEFAULT: "#FF6B2C",
          400: "#FF8552",
          500: "#FF6B2C", // primary accent
          600: "#F2540E",
          700: "#CC4309",
        },
        ink: {
          DEFAULT: "#EAF0FF",
          muted: "#9AA7C7",
          faint: "#5C6B91",
        },
        success: "#34D399",
        warning: "#FBBF24",
        danger: "#F87171",
      },
      borderRadius: { xl: "16px", "2xl": "22px", "3xl": "28px" },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
