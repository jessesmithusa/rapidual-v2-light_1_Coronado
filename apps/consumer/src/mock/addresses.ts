import type { Address } from "@rapidual/shared";

/** Demo saved addresses, pre-matched to their OC route. */
export const MOCK_ADDRESSES: Address[] = [
  {
    id: "addr_home",
    label: "Home",
    line1: "1820 E Edinger Ave",
    city: "Santa Ana",
    state: "CA",
    zip: "92705",
    lat: 33.7455,
    lng: -117.8677,
    routeId: "oc-santaana-central",
  },
  {
    id: "addr_office",
    label: "Office",
    line1: "200 Spectrum Center Dr",
    city: "Irvine",
    state: "CA",
    zip: "92618",
    lat: 33.6515,
    lng: -117.7448,
    routeId: "oc-irvine-north",
  },
];
