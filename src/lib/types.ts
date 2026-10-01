// Core domain types for Barber Now
import type { ServiceCategory, SalonType } from "./supabase/database.types";
export type { ServiceCategory, SalonType };

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number; // in INR
  durationMinutes: number;
  discountPercent?: number; // optional offer
  category: ServiceCategory;
}

export interface Review {
  id: string;
  userName: string;
  rating: number; // 1..5
  comment: string;
  date: string; // ISO
}

export interface Barber {
  id: string;
  name: string;
  avatarUrl: string;
  specialities: string[];
  rating: number;
  experienceYears: number;
}

export interface Shop {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  address: string;
  area: string; // locality
  city: string;
  distanceKm: number; // precomputed for the mock "near me"
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  acceptsSongRequests: boolean;
  /** Paid boost active → shown as "Sponsored" at the top. */
  isBoosted: boolean;
  /** Who the salon serves. */
  salonType: SalonType;
  femaleStaff: boolean;
  priceLevel: 1 | 2 | 3; // ₹ / ₹₹ / ₹₹₹
  coverImage: string;
  gallery: string[];
  openNow: boolean;
  openHours: string;
  amenities: string[];
  services: Service[];
  barbers: Barber[];
  reviews: Review[];
  // Live queue data
  queue: {
    peopleAhead: number;
    avgServiceMinutes: number;
    status: "quiet" | "moderate" | "busy";
  };
}

export interface BookingSlot {
  time: string; // e.g. "10:30 AM"
  available: boolean;
}
