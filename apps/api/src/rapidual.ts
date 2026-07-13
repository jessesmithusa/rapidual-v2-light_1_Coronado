/** Adapter boundary to the upstream Rapidual platform.
 * No real Rapidual HTTP API exists yet, so the only implementation is the
 * NullAdapter: reservations queue as handoff state 'pending' and /health says
 * so explicitly — we never fake driver assignment or order acceptance. */

export interface RapidualAdapter {
  /** 'not_configured' until a real upstream endpoint + credentials exist. */
  status(): "not_configured" | "configured";
  /** Submit a reservation; NullAdapter always leaves it pending. */
  submit(reservationId: string): Promise<{ handoff: "pending" }>;
}

export class NullAdapter implements RapidualAdapter {
  status() {
    return "not_configured" as const;
  }
  async submit(_reservationId: string) {
    return { handoff: "pending" as const };
  }
}
