import type { Order } from "@rapidual/shared";

const now = Date.now();
const iso = (offsetMin: number) => new Date(now + offsetMin * 60_000).toISOString();

/** A sample in-flight order to demo the tracking screen + chain-of-custody. */
export const SAMPLE_ORDER: Order = {
  id: "ord_demo_8821",
  userId: "user_demo",
  subscriptionId: "sub_demo",
  addressId: "addr_home",
  routeId: "oc-santaana-central",
  stage: "washing",
  bagCount: 2,
  scheduledFor: iso(-180),
  preferences: {
    detergent: "hypoallergenic",
    fold: "standard",
    waterTemp: "warm",
    starchShirts: false,
    separateDelicates: true,
    notes: "Leave bins by the side gate.",
  },
  driver: {
    id: "drv_marisol",
    name: "Marisol R.",
    vehicle: "Rapidual Van · 7C",
    lat: 33.7421,
    lng: -117.8512,
    etaMinutes: 0,
  },
  photos: [
    { id: "p1", stage: "picked_up", url: "", capturedAt: iso(-175), capturedBy: "driver" },
    { id: "p2", stage: "at_washhq", url: "", capturedAt: iso(-150), capturedBy: "washhq" },
  ],
  createdAt: iso(-200),
  updatedAt: iso(-20),
};
