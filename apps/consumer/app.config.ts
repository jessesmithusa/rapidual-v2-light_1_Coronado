import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Rapidual Consumer — Expo config.
 * Brand: dark navy (#0A1124) + orange accent (#FF6B2C).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Rapidual",
  slug: "rapidual-consumer",
  scheme: "rapidual",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0A1124",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.rapidual.consumer",
    usesAppleSignIn: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Rapidual uses your location to show nearby routes and track your laundry pickup and re-delivery.",
      NSCameraUsageDescription:
        "Rapidual uses the camera to capture chain-of-custody photos of your bags.",
      NSPhotoLibraryUsageDescription:
        "Rapidual lets you attach photos of your laundry bags for chain-of-custody records.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.rapidual.consumer",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0A1124",
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "CAMERA", "POST_NOTIFICATIONS"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  runtimeVersion: { policy: "appVersion" },
  updates: { fallbackToCacheTimeout: 0 },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-apple-authentication",
    ["expo-image-picker", { photosPermission: "Allow Rapidual to attach bag photos." }],
    ["expo-location", { locationWhenInUsePermission: "Show nearby routes and track deliveries." }],
    ["expo-notifications", { color: "#FF6B2C" }],
    [
      "@rnmapbox/maps",
      {
        // Pulled from env at build time; never committed.
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? "",
      },
    ],
    [
      "@stripe/stripe-react-native",
      { merchantIdentifier: "merchant.com.rapidual", enableGooglePay: true },
    ],
  ],
  experiments: { typedRoutes: true, tsconfigPaths: true },
  extra: {
    eas: { projectId: "00000000-0000-0000-0000-000000000000" },
  },
});
