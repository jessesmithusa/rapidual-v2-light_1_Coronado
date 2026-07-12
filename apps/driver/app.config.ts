import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Rapidual Driver",
  slug: "rapidual-driver",
  scheme: "rapidualdriver",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#0A1124" },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.rapidual.driver",
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "Rapidual Driver uses your location to navigate the route and order stops.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "Rapidual Driver tracks the route while you drive so customers see live ETAs.",
      NSCameraUsageDescription: "Rapidual Driver uses the camera for chain-of-custody photos at each stop.",
      UIBackgroundModes: ["location", "fetch"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.rapidual.driver",
    adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#0A1124" },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "CAMERA"],
  },
  web: { bundler: "metro", output: "static", favicon: "./assets/favicon.png" },
  runtimeVersion: { policy: "appVersion" },
  updates: { fallbackToCacheTimeout: 0 },
  plugins: [
    "expo-router",
    "expo-secure-store",
    ["expo-image-picker", { photosPermission: "Capture chain-of-custody photos." }],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Navigate the route and order stops.",
        locationAlwaysAndWhenInUsePermission: "Share live location with customers while you drive.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    ["@rnmapbox/maps", { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN ?? "" }],
  ],
  experiments: { typedRoutes: true, tsconfigPaths: true },
  extra: { eas: { projectId: "00000000-0000-0000-0000-000000000001" } },
});
