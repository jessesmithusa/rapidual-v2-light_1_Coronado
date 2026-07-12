export type RouteStatus = "on_time" | "behind" | "idle";

export interface DispatchRoute {
  id: string;
  name: string;
  driver: string | null;
  done: number;
  total: number;
  utilization: number;
  status: RouteStatus;
  exceptions: number;
}

export const DISPATCH_ROUTES: DispatchRoute[] = [
  { id: "tustin", name: "Tustin Legacy", driver: "Maya R.", done: 3, total: 8, utilization: 0.94, status: "on_time", exceptions: 0 },
  { id: "irvine", name: "Irvine North", driver: "Sam O.", done: 5, total: 9, utilization: 0.88, status: "behind", exceptions: 1 },
  { id: "santaana", name: "Santa Ana Central", driver: null, done: 0, total: 7, utilization: 0, status: "idle", exceptions: 0 },
  { id: "newport", name: "Newport Coast", driver: "Lee K.", done: 6, total: 6, utilization: 0.91, status: "on_time", exceptions: 0 },
  { id: "costamesa", name: "Costa Mesa Westside", driver: "Dana P.", done: 2, total: 10, utilization: 0.83, status: "on_time", exceptions: 1 },
];
