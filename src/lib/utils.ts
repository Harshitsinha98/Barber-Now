import type { Shop, Service, BookingSlot } from "./types";

/** Format an INR amount like ₹1,299 */
export function formatINR(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

/** Price level → rupee symbols */
export function priceLevelLabel(level: 1 | 2 | 3): string {
  return "₹".repeat(level);
}

/** Effective price after discount */
export function effectivePrice(service: Service): number {
  if (!service.discountPercent) return service.price;
  return Math.round(service.price * (1 - service.discountPercent / 100));
}

/** Estimated wait time in minutes for a shop's virtual queue */
export function estimatedWaitMinutes(shop: Shop): number {
  return shop.queue.peopleAhead * shop.queue.avgServiceMinutes;
}

/** Human readable wait, e.g. "~45 min" or "No wait" */
export function waitLabel(minutes: number): string {
  if (minutes <= 0) return "No wait";
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `~${h}h ${m}m` : `~${h}h`;
}

/** Queue status → tailwind color classes */
export function queueStatusStyle(status: Shop["queue"]["status"]): {
  dot: string;
  text: string;
  bg: string;
  label: string;
} {
  switch (status) {
    case "quiet":
      return {
        dot: "bg-emerald-500",
        text: "text-emerald-700",
        bg: "bg-emerald-50",
        label: "Quiet",
      };
    case "moderate":
      return {
        dot: "bg-amber-500",
        text: "text-amber-700",
        bg: "bg-amber-50",
        label: "Moderate",
      };
    case "busy":
      return {
        dot: "bg-rose-500",
        text: "text-rose-700",
        bg: "bg-rose-50",
        label: "Busy",
      };
  }
}

/** Generate booking slots for a given day from mock availability */
export function generateSlots(seed = 0): BookingSlot[] {
  const times = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM",
    "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "04:00 PM",
    "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
    "07:00 PM", "07:30 PM", "08:00 PM",
  ];
  return times.map((time, i) => ({
    time,
    // deterministic pseudo-availability so SSR matches client
    available: (i * 7 + seed * 3) % 5 !== 0,
  }));
}

/** Compute total price + duration for selected services */
export function summarize(services: Service[]): {
  total: number;
  originalTotal: number;
  duration: number;
} {
  return services.reduce(
    (acc, s) => {
      acc.total += effectivePrice(s);
      acc.originalTotal += s.price;
      acc.duration += s.durationMinutes;
      return acc;
    },
    { total: 0, originalTotal: 0, duration: 0 }
  );
}


export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Haversine distance between two lat/lng points, in kilometres.
 * Used to compute how far each shop is from the user's device location.
 */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Round distance for display: <10km shows one decimal, else whole km. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
