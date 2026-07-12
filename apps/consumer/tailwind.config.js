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
        // ── Rapidual light theme (Uber / DoorDash / Instacart energy) ──
        // NOTE: the `navy-*` scale keeps its class names for compatibility
        // with every existing screen, but the VALUES are remapped to light
        // neutrals: 900 = page background, 700 = card surface, 600 = chip
        // fill, 500 = hairline border. The driver app stays dark on purpose
        // (like Uber Driver). See src/theme/tokens.ts.
        navy: {
          950: "#EFEFEC",
          900: "#F7F7F5", // app background — warm off-white
          800: "#FFFFFF", // tab bar / headers
          700: "#FFFFFF", // surface / cards
          600: "#F1F2F4", // chips / elevated fills
          500: "#E6E8EC", // hairline borders
          400: "#CBD0D8",
        },
        orange: {
          DEFAULT: "#FF6B2C",
          400: "#F2540E", // accent TEXT on light surfaces (was a tint on dark)
          500: "#FF6B2C", // primary fills
          600: "#E8500D",
          700: "#C24309",
        },
        ink: {
          DEFAULT: "#17181C", // near-black
          muted: "#5E6470",
          faint: "#9AA0AB",
        },
        success: "#0E9F6E",
        warning: "#B45309",
        danger: "#DC2626",
      },
      borderRadius: { xl: "16px", "2xl": "22px", "3xl": "28px" },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
