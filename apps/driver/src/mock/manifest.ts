import type { DriverManifest, LaundryPreferences } from "@rapidual/shared";

/** WashHQ — the depot every route starts and ends at. */
export const WASHHQ = { lat: 33.7300, lng: -117.8700 };

const prefs: LaundryPreferences = {
  detergent: "hypoallergenic",
  fold: "hang_dry",
  waterTemp: "warm",
  starchShirts: false,
  separateDelicates: true,
  notes: "Leave bins by the side gate.",
};

/** A driver's day on the Santa Ana Central route — laundry + parcels interleaved. */
export const MOCK_MANIFEST: DriverManifest = {
  routeId: "oc-santaana-central",
  routeName: "Santa Ana Central",
  serviceDay: 3,
  driver: { name: "Marisol R.", vehicle: "Van 7C" },
  utilization: 0.94,
  stops: [
    { id: "s1", seq: 1, kind: "pickup", customerName: "Alana T.", address: "2207 N Bristol St", lat: 33.7455, lng: -117.8677, status: "done", bagCount: 2, orderId: "ord_1001", stage: "picked_up" },
    { id: "s2", seq: 2, kind: "parcel", customerName: "Target", partner: "Target", address: "1410 E 4th St", lat: 33.7489, lng: -117.8601, status: "done", parcelCount: 1 },
    { id: "s3", seq: 3, kind: "redeliver", customerName: "Devon M.", address: "318 W Walnut St", lat: 33.7512, lng: -117.8541, status: "done", bagCount: 2, orderId: "ord_1002", stage: "delivered" },
    { id: "s4", seq: 4, kind: "parcel", customerName: "Costco", partner: "Costco", address: "890 S Main St", lat: 33.7455, lng: -117.8482, status: "done", parcelCount: 3 },
    { id: "s5", seq: 5, kind: "pickup", customerName: "Priya S.", address: "612 N Flower St", lat: 33.7398, lng: -117.8423, status: "done", bagCount: 1, orderId: "ord_1003", stage: "picked_up" },
    { id: "s6", seq: 6, kind: "pickup", customerName: "Alex R.", address: "1820 E Edinger Ave", lat: 33.7360, lng: -117.8500, status: "active", bagCount: 2, orderId: "ord_demo_8821", stage: "scheduled", preferences: prefs, windowStart: "8:00 AM", windowEnd: "10:00 AM" },
    { id: "s7", seq: 7, kind: "parcel", customerName: "Best Buy", partner: "Best Buy", address: "2300 E Dyer Rd", lat: 33.7321, lng: -117.8602, status: "upcoming", parcelCount: 1 },
    { id: "s8", seq: 8, kind: "redeliver", customerName: "Marcus L.", address: "745 S Grand Ave", lat: 33.7380, lng: -117.8650, status: "upcoming", bagCount: 4, orderId: "ord_1004", stage: "driver_enroute_delivery" },
  ],
};
