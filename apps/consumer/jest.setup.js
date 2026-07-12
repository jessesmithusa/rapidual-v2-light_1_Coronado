/* Test environment mocks for native + backend modules. */
require("@testing-library/react-native/extend-expect");

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock"),
);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
  Stack: Object.assign(() => null, { Screen: () => null }),
  Tabs: Object.assign(() => null, { Screen: () => null }),
}));

jest.mock("@rnmapbox/maps", () => ({}), { virtual: true });
jest.mock("@stripe/stripe-react-native", () => ({}), { virtual: true });

jest.mock("expo-apple-authentication", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
  openBrowserAsync: jest.fn(),
}));
jest.mock("expo-linking", () => ({
  createURL: jest.fn(() => "rapidual://"),
  parse: jest.fn(() => ({ queryParams: {} })),
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied", granted: false }),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockResolvedValue({ error: null }),
    })),
    channel: jest.fn(() => ({ on: jest.fn().mockReturnThis(), subscribe: jest.fn().mockReturnThis(), send: jest.fn() })),
    removeChannel: jest.fn(),
    functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
    storage: { from: jest.fn(() => ({ upload: jest.fn(), createSignedUrl: jest.fn() })) },
  },
}));
