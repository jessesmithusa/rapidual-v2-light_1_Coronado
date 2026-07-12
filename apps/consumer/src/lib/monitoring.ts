import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Crash reporting, on only when EXPO_PUBLIC_SENTRY_DSN is set and we're in a
 * dev/standalone build. Zero-config default: does nothing.
 */
export function initMonitoring(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || isExpoGo) return;
  try {
    const Sentry = require("@sentry/react-native");
    Sentry.init({ dsn, tracesSampleRate: 0.2 });
  } catch {
    // dependency not installed — fine
  }
}
