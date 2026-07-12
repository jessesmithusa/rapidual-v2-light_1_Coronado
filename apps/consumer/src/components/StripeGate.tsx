import Constants, { ExecutionEnvironment } from "expo-constants";
import type { ReactNode } from "react";
import { env } from "@/lib/env";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Wraps the app in StripeProvider on dev/standalone builds. In Expo Go (or
 * without a publishable key) it renders children unchanged so the app still boots.
 */
export function StripeGate({ children }: { children: ReactNode }) {
  if (isExpoGo || !env.stripeKey) return <>{children}</>;
  try {
    const { StripeProvider } = require("@stripe/stripe-react-native");
    return (
      <StripeProvider publishableKey={env.stripeKey} merchantIdentifier="merchant.com.rapidual">
        {children}
      </StripeProvider>
    );
  } catch {
    return <>{children}</>;
  }
}
