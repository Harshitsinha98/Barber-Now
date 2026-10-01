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

/** Minutes since midnight → "09:30 AM" */
export function formatSlot(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Current time in India as minutes since midnight. */
export function istNowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return (h % 24) * 60 + m;
}

/**
 * Today's 30-minute slots between 9 AM and 9 PM. A slot is unavailable if it
 * is already booked or starts within the next 15 minutes.
 */
export function buildSlots(taken: string[], nowMinutes: number | null): BookingSlot[] {
  const takenSet = new Set(taken);
  const slots: BookingSlot[] = [];
  for (let t = 9 * 60; t < 21 * 60; t += 30) {
    const time = formatSlot(t);
    const past = nowMinutes != null && t < nowMinutes + 15;
    slots.push({ time, available: !past && !takenSet.has(time) });
  }
  return slots;
}

/** "booked" → "Booked", "in_service" → "In chair" … */
export const BOOKING_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  booked: { label: "Confirmed", cls: "bg-blue-50 text-blue-700" },
  in_queue: { label: "In queue", cls: "bg-amber-50 text-amber-700" },
  in_service: { label: "In chair", cls: "bg-emerald-50 text-emerald-700" },
  done: { label: "Completed", cls: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", cls: "bg-rose-50 text-rose-700" },
  no_show: { label: "No-show", cls: "bg-black/5 text-ink/60" },
};

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

/**
 * Clean a free-text song request: strip control chars / angle brackets,
 * collapse whitespace, cap at 100 chars. Returns null when empty.
 */
export function cleanSongRequest(raw: unknown): string | null {
  const s = String(raw ?? "")
    .replace(/\s+/g, " ") // newlines/tabs → single space first
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, 100);
  return s || null;
}

/** YouTube search link for a song request (barber taps to play). */
export function youtubeSearchUrl(song: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`;
}
