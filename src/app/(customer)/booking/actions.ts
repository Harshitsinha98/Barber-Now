"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { displayName, userPhone } from "@/lib/auth";
import { cleanSongRequest } from "@/lib/utils";

export interface CreateBookingInput {
  shopId: string;
  serviceIds: string[];
  barberId: string | null; // null = any
  mode: "queue" | "slot";
  slotTime?: string | null;
  songRequest?: string | null;
}

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string; needsAuth?: boolean };

const ACTIVE = ["booked", "in_queue", "in_service"];

/**
 * Persist a customer booking. The shop's live queue count is kept in sync by
 * a DB trigger (see 0005_panels_upgrade.sql), so nothing to recompute here.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first.", needsAuth: true };

  const serviceIds = Array.from(new Set(input.serviceIds)).filter(Boolean);
  if (!input.shopId || serviceIds.length === 0) {
    return { ok: false, error: "Select at least one service." };
  }
  if (input.mode === "slot" && !input.slotTime) {
    return { ok: false, error: "Pick a time slot." };
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", input.shopId)
    .eq("is_published", true)
    .maybeSingle();
  if (!shop) return { ok: false, error: "This shop is not available right now." };
  if (input.mode === "queue" && !shop.open_now) {
    return { ok: false, error: "The shop is closed — book a slot instead." };
  }

  // Don't let one customer hold several places in the same shop's queue.
  const { count: existing } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", input.shopId)
    .eq("customer_id", user.id)
    .in("status", ACTIVE);
  if ((existing ?? 0) > 0) {
    return {
      ok: false,
      error: "You already have an active booking at this shop. Check My Bookings.",
    };
  }

  // Price from the DB, never from the client.
  const { data: services } = await supabase
    .from("services")
    .select("id, price, discount_percent")
    .eq("shop_id", input.shopId)
    .eq("is_active", true)
    .in("id", serviceIds);
  if (!services || services.length !== serviceIds.length) {
    return { ok: false, error: "Some selected services are no longer available." };
  }
  const total = services.reduce(
    (sum, s) =>
      sum +
      (s.discount_percent ? Math.round(s.price * (1 - s.discount_percent / 100)) : s.price),
    0
  );

  // Only store a song if the shop accepts requests (and only send the column
  // when there is one, so bookings keep working before migration 0006).
  const song = shop.accepts_song_requests === true ? cleanSongRequest(input.songRequest) : null;

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      shop_id: input.shopId,
      customer_id: user.id,
      customer_name: displayName(user),
      customer_phone: userPhone(user) || null,
      barber_id: input.barberId,
      service_ids: serviceIds,
      mode: input.mode,
      slot_time: input.mode === "slot" ? input.slotTime : null,
      status: input.mode === "queue" ? "in_queue" : "booked",
      total_amount: total,
      ...(song ? { song_request: song } : {}),
    })
    .select("id")
    .single();

  if (error || !booking) {
    if (error?.code === "23505") {
      return { ok: false, error: "That slot was just taken — please pick another." };
    }
    return { ok: false, error: error?.message || "Could not create booking." };
  }

  revalidatePath("/bookings");
  return { ok: true, bookingId: booking.id as string };
}

/** Customer cancels their own (still active) booking. */
export async function cancelMyBooking(bookingId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .in("status", ["booked", "in_queue"])
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "This booking can no longer be cancelled." };
  }
  revalidatePath("/bookings");
  revalidatePath("/booking/confirm");
  return { ok: true };
}

export interface QueueStatus {
  status: string;
  ahead: number;
  avgMinutes: number;
}

/** Live position for the confirm page (polled every few seconds). */
export async function getQueueStatus(bookingId: string): Promise<QueueStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: b } = await supabase
    .from("bookings")
    .select("status, shop_id")
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!b) return null;

  const [{ data: ahead }, { data: shop }] = await Promise.all([
    supabase.rpc("my_queue_position", { p_booking: bookingId }),
    supabase.from("shops").select("queue_avg_minutes").eq("id", b.shop_id).maybeSingle(),
  ]);

  return {
    status: b.status as string,
    ahead: Number(ahead ?? 0),
    avgMinutes: shop?.queue_avg_minutes ?? 20,
  };
}

/** Review a completed booking (one review per booking). */
export async function submitReview(
  bookingId: string,
  rating: number,
  comment: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const r = Math.round(rating);
  if (r < 1 || r > 5) return { ok: false, error: "Choose a rating from 1 to 5." };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, shop_id, status")
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.status !== "done") {
    return { ok: false, error: "You can review after your visit is completed." };
  }

  const { error } = await supabase.from("reviews").insert({
    shop_id: booking.shop_id,
    customer_id: user.id,
    booking_id: booking.id,
    reviewer_name: displayName(user),
    rating: r,
    comment: comment.trim().slice(0, 500) || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You already reviewed this visit." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/bookings");
  return { ok: true };
}

/** Update the customer's display name. */
export async function updateProfileName(
  _prev: { error: string | null; ok?: boolean },
  formData: FormData
): Promise<{ error: string | null; ok?: boolean }> {
  const name = String(formData.get("fullName") ?? "").trim().slice(0, 60);
  if (name.length < 2) return { error: "Please enter your name." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  const [{ error: authErr }, { error: profErr }] = await Promise.all([
    supabase.auth.updateUser({ data: { full_name: name } }),
    supabase.from("profiles").update({ full_name: name }).eq("id", user.id),
  ]);
  if (authErr || profErr) return { error: (authErr || profErr)!.message };

  revalidatePath("/", "layout");
  return { error: null, ok: true };
}

/** Change (or remove) the song request on an active booking. */
export async function updateSongRequest(
  bookingId: string,
  song: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const { data, error } = await supabase
    .from("bookings")
    .update({ song_request: cleanSongRequest(song) })
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .in("status", ["booked", "in_queue"])
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "This booking can't be changed now." };
  revalidatePath("/booking/confirm");
  return { ok: true };
}
