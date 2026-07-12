/**
 * Brand tokens mirrored from tailwind.config.js for places that can't use
 * className strings (Mapbox layer styles, StatusBar, ActivityIndicator, etc.).
 */
export const colors = {
  navy950: "#070C1C",
  navy900: "#0A1124",
  navy800: "#0D1530",
  navy700: "#131C3A",
  navy600: "#1B2748",
  navy500: "#27365F",
  navy400: "#3A4C7A",
  orange: "#FF6B2C",
  orange400: "#FF8552",
  orange600: "#F2540E",
  ink: "#EAF0FF",
  inkMuted: "#9AA7C7",
  inkFaint: "#5C6B91",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
} as const;

// Mapbox dark style tuned to the Rapidual palette.
export const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";
