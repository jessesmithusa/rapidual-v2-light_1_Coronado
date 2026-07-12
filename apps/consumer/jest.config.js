module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@rapidual/ui$": "<rootDir>/../../packages/ui/src",
    "^@rapidual/shared$": "<rootDir>/../../packages/shared/src",
    "^@rapidual/utils$": "<rootDir>/../../packages/utils/src",
    "^@rapidual/logistics-engine$": "<rootDir>/../../packages/logistics-engine/src",
    "\\.(css)$": "<rootDir>/jest.empty.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-reanimated|nativewind|react-native-css-interop|@rnmapbox|@rapidual/.*))",
  ],
};
