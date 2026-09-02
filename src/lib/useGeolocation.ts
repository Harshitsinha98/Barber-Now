"use client";

import { useCallback, useState } from "react";
import type { Coords } from "./utils";

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

interface GeoState {
  coords: Coords | null;
  status: GeoStatus;
  error: string | null;
}

/**
 * Requests the device's location via the browser Geolocation API.
 * We only ask when the user explicitly triggers `locate()` (better UX &
 * privacy — no surprise permission prompt on page load).
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    coords: null,
    status: "idle",
    error: null,
  });

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({
        coords: null,
        status: "unavailable",
        error: "Location is not supported on this device.",
      });
      return;
    }

    setState((s) => ({ ...s, status: "locating", error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          status: "granted",
          error: null,
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setState({
          coords: null,
          status: denied ? "denied" : "unavailable",
          error: denied
            ? "Location permission denied. You can still search by city."
            : "Couldn't get your location. Try again or search by city.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const clear = useCallback(() => {
    setState({ coords: null, status: "idle", error: null });
  }, []);

  return { ...state, locate, clear };
}
