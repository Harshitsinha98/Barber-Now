import "server-only";
import { createClient } from "./supabase/server";
import type {
  ShopRow,
  ServiceRow,
  BarberRow,
  ReviewRow,
  BookingRow,
  BookingStatus,
} from "./supabase/database.types";
import type { Shop, Service, Barber, Review } from "./types";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80";

export function avatarFor(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=1a1d24&color=c9a24b&size=128&bold=true`;
}

function mapService(r: ServiceRow): Service {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    price: r.price,
    durationMinutes: r.duration_minutes,
    discountPercent: r.discount_percent ?? undefined,
    category: r.category,
  };
}

function mapBarber(r: BarberRow): Barber {
  return {
    id: r.id,
    name: r.name,
    avatarUrl: r.avatar_url || avatarFor(r.name),
    specialities: r.specialities ?? [],
    rating: Number(r.rating) || 5,
    experienceYears: r.experience_years,
  };
}

/** Shop row + children → the camelCase `Shop` the UI uses. */
export function mapShop(
  row: ShopRow,
  services: ServiceRow[],
  barbers: BarberRow[],
  reviews: ReviewRow[]
): Shop {
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0
      ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviewCount) * 10) / 10
      : 0;

  const mappedReviews: Review[] = [...reviews]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => ({
      id: r.id,
      userName: r.reviewer_name || "Customer",
      rating: r.rating,
      comment: r.comment ?? "",
      date: r.created_at,
    }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    address: row.address ?? "",
    area: row.area ?? "",
    city: row.city ?? "",
    distanceKm: 0, // computed client-side from device location
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    rating,
    reviewCount,
    isVerified: Boolean(row.is_verified),
    priceLevel: (Number(row.price_level) || 2) as 1 | 2 | 3,
    coverImage: row.cover_image || FALLBACK_COVER,
    gallery: row.gallery ?? [],
    openNow: row.open_now,
    openHours: row.open_hours ?? "",
    amenities: row.amenities ?? [],
    services: services.filter((s) => s.is_active).map(mapService),
    barbers: barbers.filter((b) => b.is_active).map(mapBarber),
    reviews: mappedReviews,
    queue: {
      peopleAhead: row.queue_people_ahead,
      avgServiceMinutes: row.queue_avg_minutes,
      status: row.queue_status,
    },
  };
}

type Db = Awaited<ReturnType<typeof createClient>>;

/** Hydrate a list of shop rows with their services, barbers and reviews. */
async function hydrate(supabase: Db, rows: ShopRow[]): Promise<Shop[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: services }, { data: barbers }, { data: reviews }] = await Promise.all([
    supabase.from("services").select("*").in("shop_id", ids),
    supabase.from("barbers").select("*").in("shop_id", ids),
    supabase.from("reviews").select("*").in("shop_id", ids),
  ]);
  const svc = (services as ServiceRow[]) ?? [];
  const brb = (barbers as BarberRow[]) ?? [];
  const rvw = (reviews as ReviewRow[]) ?? [];
  return rows.map((row) =>
    mapShop(
      row,
      svc.filter((s) => s.shop_id === row.id),
      brb.filter((b) => b.shop_id === row.id),
      rvw.filter((r) => r.shop_id === row.id)
    )
  );
}

/** Published (and not suspended) shops for the discovery page. */
export async function getPublishedShops(): Promise<Shop[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("shops")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    // Shops that never added a service can't be booked — hide them.
    const shops = await hydrate(supabase, (data as ShopRow[]) ?? []);
    return shops.filter((s) => s.services.length > 0);
  } catch {
    return [];
  }
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<ShopRow>();
  if (!data) return null;
  const [shop] = await hydrate(supabase, [data]);
  return shop ?? null;
}

async function getShopById(supabase: Db, id: string): Promise<Shop | null> {
  const { data } = await supabase.from("shops").select("*").eq("id", id).maybeSingle<ShopRow>();
  if (!data) return null;
  const [shop] = await hydrate(supabase, [data]);
  return shop ?? null;
}

/** Slot times already booked today at a shop. */
export async function getTakenSlots(shopId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("taken_slots", { p_shop: shopId });
    return (data as string[] | null) ?? [];
  } catch {
    return [];
  }
}

export const ACTIVE_STATUSES: BookingStatus[] = ["booked", "in_queue", "in_service"];

export interface MyBooking {
  id: string;
  status: BookingStatus;
  mode: "queue" | "slot";
  slotTime: string | null;
  bookingDate: string;
  totalAmount: number;
  createdAt: string;
  serviceNames: string[];
  totalDuration: number;
  barberName: string | null;
  reviewed: boolean;
  shop: Shop;
}

function toMyBooking(b: BookingRow, shop: Shop, reviewed: boolean): MyBooking {
  const chosen = shop.services.filter((s) => b.service_ids.includes(s.id));
  return {
    id: b.id,
    status: b.status,
    mode: b.mode,
    slotTime: b.slot_time,
    bookingDate: b.booking_date,
    totalAmount: b.total_amount,
    createdAt: b.created_at,
    serviceNames: chosen.map((s) => s.name),
    totalDuration: chosen.reduce((a, s) => a + s.durationMinutes, 0),
    barberName: b.barber_id
      ? shop.barbers.find((x) => x.id === b.barber_id)?.name ?? null
      : null,
    reviewed,
    shop,
  };
}

/** One booking owned by the current user. */
export async function getBookingDetail(bookingId: string): Promise<MyBooking | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .maybeSingle<BookingRow>();
  if (!booking) return null;

  const [shop, { count }] = await Promise.all([
    getShopById(supabase, booking.shop_id),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("booking_id", booking.id),
  ]);
  if (!shop) return null;
  return toMyBooking(booking, shop, (count ?? 0) > 0);
}

/** All of the current user's bookings, newest first. */
export async function getMyBookings(): Promise<MyBooking[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });
  const bookings = (data as BookingRow[]) ?? [];
  if (bookings.length === 0) return [];

  const shopIds = Array.from(new Set(bookings.map((b) => b.shop_id)));
  const [{ data: shopRows }, { data: reviewRows }] = await Promise.all([
    supabase.from("shops").select("*").in("id", shopIds),
    supabase.from("reviews").select("booking_id").eq("customer_id", user.id),
  ]);
  const shops = await hydrate(supabase, (shopRows as ShopRow[]) ?? []);
  const shopMap = new Map(shops.map((s) => [s.id, s]));
  const reviewed = new Set(
    ((reviewRows as { booking_id: string | null }[]) ?? []).map((r) => r.booking_id)
  );

  return bookings.flatMap((b) => {
    const shop = shopMap.get(b.shop_id);
    return shop ? [toMyBooking(b, shop, reviewed.has(b.id))] : [];
  });
}
