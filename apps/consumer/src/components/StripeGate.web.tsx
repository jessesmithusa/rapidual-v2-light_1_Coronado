import type { ReactNode } from "react";

/** Web preview — Stripe PaymentSheet is native-only; pass children through unchanged. */
export function StripeGate({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
