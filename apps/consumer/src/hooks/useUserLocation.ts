import { useEffect, useState } from "react";
import * as Location from "expo-location";

/** Default to Santa Ana so the OC routes are always in frame, even without permission. */
const SANTA_ANA = { lat: 33.7455, lng: -117.8677 };

export function useUserLocation() {
  const [coords, setCoords] = useState(SANTA_ANA);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (active) setGranted(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (active) {
          setGranted(true);
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        if (active) setGranted(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { coords, granted };
}
