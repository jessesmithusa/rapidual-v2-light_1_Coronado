export type ActivityStatus = "in_progress" | "upcoming" | "completed";
export type ActivityKind = "laundry" | "retail";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  date: string;
  amount: number;
  status: ActivityStatus;
  icon: string;
}

export const ACTIVITY: ActivityItem[] = [
  { id: "ord_8123", kind: "laundry", title: "Wash · Dry · Fold", subtitle: "3 bags · En route to you", date: "Today, 4:30 PM", amount: 19.5, status: "in_progress", icon: "shirt" },
  { id: "ord_8124", kind: "retail", title: "Target", subtitle: "8 items · Out for delivery", date: "Today, 5:15 PM", amount: 47.2, status: "in_progress", icon: "basket" },
  { id: "ord_8130", kind: "laundry", title: "Wash · Dry · Fold", subtitle: "2 bags · Scheduled", date: "Fri, 9:00 AM", amount: 13.5, status: "upcoming", icon: "shirt" },
  { id: "ord_8131", kind: "retail", title: "CVS Pharmacy", subtitle: "Prescription refill", date: "Sat, 11:00 AM", amount: 22.0, status: "upcoming", icon: "medkit" },
  { id: "ord_8090", kind: "laundry", title: "Wash · Dry · Fold", subtitle: "4 bags · Delivered", date: "Mon, May 25", amount: 24.0, status: "completed", icon: "shirt" },
  { id: "ord_8088", kind: "retail", title: "Costco", subtitle: "12 items · Delivered", date: "Sun, May 24", amount: 53.4, status: "completed", icon: "basket" },
  { id: "ord_8071", kind: "laundry", title: "Wash · Dry · Fold", subtitle: "2 bags · Delivered", date: "Thu, May 21", amount: 13.5, status: "completed", icon: "shirt" },
];
