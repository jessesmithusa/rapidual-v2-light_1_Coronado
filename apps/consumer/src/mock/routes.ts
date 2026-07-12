import type { Route } from "@rapidual/shared";

/** Realistic Orange County routes for the home map + nearby-routes feature. */
export const OC_ROUTES: Route[] = [
  {
    id: "oc-irvine-north",
    name: "OC · Irvine North",
    city: "Irvine",
    serviceDay: 2, // Tue
    loadType: "dual",
    utilization: 0.95,
    activeSubscribers: 412,
    parcelStops: 138,
    path: [
      { lat: 33.6846, lng: -117.8265 },
      { lat: 33.6921, lng: -117.8112 },
      { lat: 33.7016, lng: -117.7989 },
      { lat: 33.7104, lng: -117.8203 },
    ],
  },
  {
    id: "oc-santaana-central",
    name: "OC · Santa Ana Central",
    city: "Santa Ana",
    serviceDay: 3, // Wed
    loadType: "dual",
    utilization: 0.94,
    activeSubscribers: 506,
    parcelStops: 171,
    path: [
      { lat: 33.7455, lng: -117.8677 },
      { lat: 33.7512, lng: -117.8541 },
      { lat: 33.7398, lng: -117.8423 },
      { lat: 33.7321, lng: -117.8602 },
    ],
  },
  {
    id: "oc-tustin-legacy",
    name: "OC · Tustin Legacy",
    city: "Tustin",
    serviceDay: 4, // Thu
    loadType: "laundry",
    utilization: 0.89,
    activeSubscribers: 287,
    parcelStops: 64,
    path: [
      { lat: 33.7458, lng: -117.8261 },
      { lat: 33.7361, lng: -117.8157 },
      { lat: 33.7287, lng: -117.8294 },
    ],
  },
  {
    id: "oc-newport-coast",
    name: "OC · Newport Coast",
    city: "Newport Beach",
    serviceDay: 5, // Fri
    loadType: "dual",
    utilization: 0.96,
    activeSubscribers: 198,
    parcelStops: 92,
    path: [
      { lat: 33.6189, lng: -117.9298 },
      { lat: 33.6102, lng: -117.9081 },
      { lat: 33.6024, lng: -117.8889 },
    ],
  },
  {
    id: "oc-costamesa-westside",
    name: "OC · Costa Mesa Westside",
    city: "Costa Mesa",
    serviceDay: 1, // Mon
    loadType: "dual",
    utilization: 0.93,
    activeSubscribers: 344,
    parcelStops: 119,
    path: [
      { lat: 33.6411, lng: -117.9187 },
      { lat: 33.6498, lng: -117.9043 },
      { lat: 33.6359, lng: -117.8966 },
    ],
  },
];
