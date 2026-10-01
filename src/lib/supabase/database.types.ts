// Hand-written types matching supabase/migrations/*.sql
// (You can later regenerate these with: supabase gen types typescript)

export type UserRole = "customer" | "barber";
export type ServiceCategory = "hair" | "beard" | "shave" | "spa" | "combo" | "kids";
export type PriceLevel = "1" | "2" | "3";
export type QueueStatus = "quiet" | "moderate" | "busy";
export type BookingMode = "queue" | "slot";
export type BookingStatus =
  | "booked"
  | "in_queue"
  | "in_service"
  | "done"
  | "cancelled"
  | "no_show";

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ShopRow {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  tagline: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  price_level: PriceLevel;
  cover_image: string | null;
  gallery: string[];
  amenities: string[];
  open_now: boolean;
  open_hours: string | null;
  is_published: boolean;
  queue_people_ahead: number;
  queue_avg_minutes: number;
  queue_status: QueueStatus;
  is_verified: boolean;
  is_suspended: boolean;
  /** Undefined until migration 0006 is applied. */
  accepts_song_requests?: boolean;
  // ── Partner program (migration 0007) ──
  onboarding_status?: "draft" | "submitted" | "approved" | "rejected";
  owner_name?: string | null;
  pincode?: string | null;
  pan_number?: string | null;
  gstin?: string | null;
  kyc_doc_path?: string | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  subscription_until?: string | null;
  boost_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  shop_id: string;
  kind: "subscription" | "boost";
  plan_code: string;
  amount: number;
  days: number;
  status: "created" | "paid" | "failed";
  method: "razorpay" | "manual";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  period_start: string | null;
  period_end: string | null;
  note: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface ShopStatsRow {
  shop_id: string;
  day: string;
  impressions: number;
  clicks: number;
  bookings: number;
}

export interface ServiceRow {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  discount_percent: number | null;
  category: ServiceCategory;
  is_active: boolean;
  created_at: string;
}

export interface BarberRow {
  id: string;
  shop_id: string;
  name: string;
  avatar_url: string | null;
  specialities: string[];
  experience_years: number;
  rating: number;
  is_active: boolean;
  created_at: string;
}

export interface BookingRow {
  id: string;
  shop_id: string;
  customer_id: string | null;
  barber_id: string | null;
  service_ids: string[];
  mode: BookingMode;
  slot_time: string | null;
  status: BookingStatus;
  queue_position: number | null;
  total_amount: number;
  customer_name: string | null;
  customer_phone: string | null;
  song_request?: string | null;
  booking_date: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  shop_id: string;
  customer_id: string | null;
  booking_id: string | null;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}
