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
  created_at: string;
  updated_at: string;
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
  created_at: string;
}

export interface ReviewRow {
  id: string;
  shop_id: string;
  customer_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}
