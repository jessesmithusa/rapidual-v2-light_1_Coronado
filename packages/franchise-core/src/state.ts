/** Reservation state machine (mirrors migrations/0002 status check). */

export const STATUSES = [
  "draft", "reserved", "submitted", "accepted", "driver_assigned", "picked_up",
  "processing", "out_for_delivery", "delivered", "settled", "canceled", "failed",
] as const;
export type Status = (typeof STATUSES)[number];

const NEXT: Record<Status, readonly Status[]> = {
  draft: ["reserved", "canceled"],
  reserved: ["submitted", "canceled"],
  submitted: ["accepted", "failed", "canceled"],
  accepted: ["driver_assigned", "failed", "canceled"],
  driver_assigned: ["picked_up", "failed", "canceled"],
  picked_up: ["processing", "failed"],
  processing: ["out_for_delivery", "failed"],
  out_for_delivery: ["delivered", "failed"],
  delivered: ["settled"],
  settled: [],
  canceled: [],
  failed: [],
};

export function canTransition(from: Status, to: Status): boolean {
  return NEXT[from].includes(to);
}

/** Cancel is only allowed before pickup. */
export function isCancelable(s: Status): boolean {
  return canTransition(s, "canceled");
}
