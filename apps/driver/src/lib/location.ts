import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { driverChannel, DRIVER_LOCATION_EVENT } from "@rapidual/shared";
import { supabase } from "./supabase";

export const LOCATION_TASK = "rapidual-driver-location";

// The background task runs outside React, so the active route is kept module-level.
let activeRouteId: string | null = null;
export const setActiveRoute = (routeId: string | null) => {
  activeRouteId = routeId;
};

// Background task: broadcasts the latest fix to the route channel even when
// the app is backgrounded. Requires a dev build (background location + task manager).
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !activeRouteId) return;
  const locations = (data as { locations?: Location.LocationObject[] })?.locations ?? [];
  const last = locations[locations.length - 1];
  if (!last) return;

  const ch = supabase.channel(driverChannel(activeRouteId));
  await new Promise<void>((resolve) => ch.subscribe((s) => s === "SUBSCRIBED" && resolve()));
  await ch.send({
    type: "broadcast",
    event: DRIVER_LOCATION_EVENT,
    payload: { lat: last.coords.latitude, lng: last.coords.longitude, etaMinutes: 0 },
  });
  await supabase.removeChannel(ch);
});

export async function startBackgroundLocation(routeId: string): Promise<boolean> {
  setActiveRoute(routeId);
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) return false;
  await Location.requestBackgroundPermissionsAsync();

  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (already) return true;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 8000,
    distanceInterval: 40,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Rapidual — on route",
      notificationBody: "Sharing live location so customers see live ETAs.",
    },
  });
  return true;
}

export async function stopBackgroundLocation(): Promise<void> {
  setActiveRoute(null);
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
}

/** Foreground live position for the map marker (null until the first fix). */
export function useDriverPosition() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const sub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || !active) return;
      sub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 25 },
        (loc) => {
          if (active) setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        },
      );
    })();
    return () => {
      active = false;
      sub.current?.remove();
    };
  }, []);

  return coords;
}
