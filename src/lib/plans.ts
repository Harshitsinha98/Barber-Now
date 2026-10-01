/**
 * BarberNow partner pricing. Single source of truth for the UI, checkout and
 * fulfilment. Prices are in INR and shown as GST-inclusive.
 */

export interface Plan {
  code: string;
  kind: "subscription" | "boost";
  name: string;
  price: number;
  days: number;
  tagline: string;
  features: string[];
  popular?: boolean;
}

export const PARTNER_PLAN: Plan = {
  code: "partner_monthly",
  kind: "subscription",
  name: "BarberNow Partner",
  price: 1499,
  days: 30,
  tagline: "Everything you need to run a crowd-free, fully booked shop.",
  features: [
    "0% commission — keep 100% of every service",
    "Unlimited online bookings & live queue",
    "Listing in the BarberNow app with ads included",
    "Walk-in manager, team & services control",
    "Reviews, ratings & daily earnings dashboard",
    "Verified Partner badge after review",
  ],
};

export const BOOST_PACKS: Plan[] = [
  {
    code: "boost_7",
    kind: "boost",
    name: "Spark",
    price: 299,
    days: 7,
    tagline: "Try it for a week",
    features: ["Top of nearby results", "“Sponsored” spotlight card", "Impressions & clicks report"],
  },
  {
    code: "boost_15",
    kind: "boost",
    name: "Blaze",
    price: 499,
    days: 15,
    tagline: "Best for festivals & weekends",
    features: ["Everything in Spark", "15 days of top placement", "Save ₹142 vs weekly"],
    popular: true,
  },
  {
    code: "boost_30",
    kind: "boost",
    name: "Inferno",
    price: 899,
    days: 30,
    tagline: "Own your area all month",
    features: ["Everything in Blaze", "30 days of top placement", "Save ₹383 vs weekly"],
  },
];

export const ALL_PLANS: Plan[] = [PARTNER_PLAN, ...BOOST_PACKS];

export function findPlan(code: string): Plan | undefined {
  return ALL_PLANS.find((p) => p.code === code);
}

/** Days left until an ISO timestamp (0 if past / missing). */
export function daysLeft(until?: string | null): number {
  if (!until) return 0;
  const ms = new Date(until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 864e5) : 0;
}

export function isActive(until?: string | null): boolean {
  return Boolean(until) && new Date(until!).getTime() > Date.now();
}

export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PINCODE_RE = /^[1-9][0-9]{5}$/;
