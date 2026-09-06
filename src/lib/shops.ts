import { createClient } from "./supabase/server";
import type {
  ShopRow,
  ServiceRow,
  BarberRow,
  ReviewRow,
} from "./supabase/database.types";
import type { Shop, Service, Barber, Review } from "./types";

/** Map a DB service row to the app Service type. */
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

/** Map a DB barber row to the app Barber type. */
function mapBarber(r: BarberRow): Barber {
  return {
    id: r.id,
    name: r.name,
    avatarUrl:
      r.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        r.name
      )}&background=1a1d24&color=c9a24b&size=128&bold=true`,
    specialities: r.specialities ?? [],
    rating: Number(r.rating) || 5,
    experienceYears: r.experience_years,
  };
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80";

interface ReviewWithProfile extends ReviewRow {
  profiles?: { full_name: string | null } | null;
}

/**
 * Combine a shop row + its children into the app `Shop` shape (camelCase).
 * rating / reviewCount are aggregated from the review rows.
 */
function mapShop(
  row: ShopRow,
  services: ServiceRow[],
  barbers: BarberRow[],
  reviews: ReviewWithProfile[]
): Shop {
  const activeServices = services.filter((s) => s.is_active).map(mapService);
  const reviewCount = reviews.length;
  const rating =
    reviewCount > 0
      ? Math.round(
          (reviews.reduce((a, r) => a + r.rating, 0) / reviewCount) * 10
        ) / 10
      : 0;

  const mappedReviews: Review[] = reviews.map((r) => ({
    id: r.id,
    userName: r.profiles?.full_name || "Customer",
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
    priceLevel: (Number(row.price_level) || 2) as 1 | 2 | 3,
    coverImage: row.cover_image || FALLBACK_COVER,
    gallery: row.gallery ?? [],
    openNow: row.open_now,
    openHours: row.open_hours ?? "",
    amenities: row.amenities ?? [],
    services: activeServices,
    barbers: barbers.filter((b) => b.is_active).map(mapBarber),
    reviews: mappedReviews,
    queue: {
      peopleAhead: row.queue_people_ahead,
      avgServiceMinutes: row.queue_avg_minutes,
      status: row.queue_status,
    },
  };
}

/**
 * All published shops for the customer discovery page, each hydrated with its
 * services, barbers and review aggregates.
 */
export async function getPublishedShops(): Promise<Shop[]> {
  const supabase = await createClient();

  const { data: shopRows } = await supabase
    .from("shops")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const rows = (shopRows as ShopRow[]) ?? [];
  if (rows.length === 0) return [];

  const shopIds = rows.map((r) => r.id);

  const [{ data: services }, { data: barbers }, { data: reviews }] =
    await Promise.all([
      supabase.from("services").select("*").in("shop_id", shopIds),
      supabase.from("barbers").select("*").in("shop_id", shopIds),
      supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .in("shop_id", shopIds),
    ]);

  const svc = (services as ServiceRow[]) ?? [];
  const brb = (barbers as BarberRow[]) ?? [];
  const rvw = (reviews as ReviewWithProfile[]) ?? [];

  return rows.map((row) =>
    mapShop(
      row,
      svc.filter((s) => s.shop_id === row.id),
      brb.filter((b) => b.shop_id === row.id),
      rvw.filter((r) => r.shop_id === row.id)
    )
  );
}

/** A single published shop by slug (hydrated), or null. */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const supabase = await createClient();

  const { data: shopRow } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<ShopRow>();

  if (!shopRow) return null;

  const [{ data: services }, { data: barbers }, { data: reviews }] =
    await Promise.all([
      supabase.from("services").select("*").eq("shop_id", shopRow.id),
      supabase.from("barbers").select("*").eq("shop_id", shopRow.id),
      supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("shop_id", shopRow.id)
        .order("created_at", { ascending: false }),
    ]);

  return mapShop(
    shopRow,
    (services as ServiceRow[]) ?? [],
    (barbers as BarberRow[]) ?? [],
    (reviews as ReviewWithProfile[]) ?? []
  );
}


import type { BookingRow } from "./supabase/database.types";

export interface BookingDetail {
  id: string;
  mode: "queue" | "slot";
  slotTime: string | null;
  status: string;
  totalAmount: number;
  serviceNames: string[];
  totalDuration: number;
  barberName: string | null;
  shop: Shop;
}

/** Load a single booking (owned by the current user) with its shop + services. */
export async function getBookingDetail(
  bookingId: string
): Promise<BookingDetail | null> {
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

  const shop = await getShopBySlugById(booking.shop_id);
  if (!shop) return null;

  // Service names + duration from the shop's hydrated services.
  const chosen = shop.services.filter((s) => booking.service_ids.includes(s.id));
  const barberName = booking.barber_id
    ? shop.barbers.find((b) => b.id === booking.barber_id)?.name ?? null
    : null;

  return {
    id: booking.id,
    mode: booking.mode,
    slotTime: booking.slot_time,
    status: booking.status,
    totalAmount: booking.total_amount,
    serviceNames: chosen.map((s) => s.name),
    totalDuration: chosen.reduce((a, s) => a + s.durationMinutes, 0),
    barberName,
    shop,
  };
}

/** Internal: hydrate a shop by id (published or not — used for the owner's own booking). */
async function getShopBySlugById(shopId: string): Promise<Shop | null> {
  const supabase = await createClient();
  const { data: shopRow } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .maybeSingle<ShopRow>();
  if (!shopRow) return null;

  const [{ data: services }, { data: barbers }, { data: reviews }] =
    await Promise.all([
      supabase.from("services").select("*").eq("shop_id", shopId),
      supabase.from("barbers").select("*").eq("shop_id", shopId),
      supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("shop_id", shopId),
    ]);

  return mapShop(
    shopRow,
    (services as ServiceRow[]) ?? [],
    (barbers as BarberRow[]) ?? [],
    (reviews as ReviewWithProfile[]) ?? []
  );
}


export interface MyBooking {
  id: string;
  status: string;
  mode: "queue" | "slot";
  slotTime: string | null;
  totalAmount: number;
  createdAt: string;
  serviceNames: string[];
  shop: Shop;
}

/** All bookings for the current user (newest first), hydrated with shop + services. */
export async function getMyBookings(): Promise<MyBooking[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows } = await supabase
    .from("bookings")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (rows as BookingRow[]) ?? [];
  if (bookings.length === 0) return [];

  // Hydrate each unique shop once.
  const shopIds = Array.from(new Set(bookings.map((b) => b.shop_id)));
  const shops = await Promise.all(shopIds.map((sid) => getShopBySlugById(sid)));
  const shopMap = new Map<string, Shop>();
  shopIds.forEach((sid, i) => {
    const s = shops[i];
    if (s) shopMap.set(sid, s);
  });

  return bookings
    .map((b) => {
      const shop = shopMap.get(b.shop_id);
      if (!shop) return null;
      const names = shop.services
        .filter((s) => b.service_ids.includes(s.id))
        .map((s) => s.name);
      return {
        id: b.id,
        status: b.status,
        mode: b.mode,
        slotTime: b.slot_time,
        totalAmount: b.total_amount,
        createdAt: b.created_at,
        serviceNames: names,
        shop,
      } as MyBooking;
    })
    .filter((b): b is MyBooking => b !== null);
}
