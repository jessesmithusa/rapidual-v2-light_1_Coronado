/**
 * Brand tokens mirrored from tailwind.config.js for places that can't use
 * className strings (Mapbox layer styles, StatusBar, ActivityIndicator, etc.).
 *
 * LIGHT THEME: the navy* keys keep their names for compatibility but now hold
 * light neutrals — navy900 is the page background, navy700 the card surface.
 * Semantic aliases (surface, border, …) are provided for new code.
 */
export const colors = {
  navy950: "#EFEFEC",
  navy900: "#F7F7F5", // page background
  navy800: "#FFFFFF", // tab bar / headers
  navy700: "#FFFFFF", // cards
  navy600: "#F1F2F4", // chips
  navy500: "#E6E8EC", // hairline borders
  navy400: "#CBD0D8",
  orange: "#FF6B2C",
  orange400: "#F2540E", // accent text on light
  orange600: "#E8500D",
  ink: "#17181C",
  inkMuted: "#5E6470",
  inkFaint: "#9AA0AB",
  success: "#0E9F6E",
  warning: "#B45309",
  danger: "#DC2626",
  // semantic aliases for new code
  background: "#F7F7F5",
  surface: "#FFFFFF",
  chip: "#F1F2F4",
  border: "#E6E8EC",
  onAccent: "#FFFFFF",
} as const;

// Mapbox light style tuned to the Rapidual light theme.
export const MAP_STYLE_URL = "mapbox://styles/mapbox/light-v11";
