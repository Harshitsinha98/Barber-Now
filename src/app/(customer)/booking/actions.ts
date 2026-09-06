"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateBookingInput {
  shopId: string;
  serviceIds: string[];
  barberId: string | null; // null = any
  mode: "queue" | "slot";
  slotTime?: string | null;
}

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string; needsAuth?: boolean };

/**
 * Persist a customer booking, then recompute the shop's live queue snapshot so
 * the discovery + shop pages show an accurate "people ahead".
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in first.", needsAuth: true };

  if (!input.shopId || input.serviceIds.length === 0) {
    return { ok: false, error: "Select at least one service." };
  }

  // Validate the shop exists & is published, and pull its services for pricing.
  const { data: shop } = await supabase
    .from("shops")
    .select("id, is_published")
    .eq("id", input.shopId)
    .eq("is_published", true)
    .maybeSingle();
  if (!shop) return { ok: false, error: "This shop is not available." };

  // Compute the total from live service prices (never trust the client).
  const { data: services } = await supabase
    .from("services")
    .select("id, price, discount_percent")
    .eq("shop_id", input.shopId)
    .in("id", input.serviceIds);

  const total = (services ?? []).reduce((sum, s) => {
    const price = s.discount_percent
      ? Math.round(s.price * (1 - s.discount_percent / 100))
      : s.price;
    return sum + price;
  }, 0);

  // Insert the booking.
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      shop_id: input.shopId,
      customer_id: user.id,
      barber_id: input.barberId,
      service_ids: input.serviceIds,
      mode: input.mode,
      slot_time: input.mode === "slot" ? input.slotTime ?? null : null,
      status: input.mode === "queue" ? "in_queue" : "booked",
      total_amount: total,
    })
    .select("id")
    .single();

  if (error || !booking) {
    return { ok: false, error: error?.message || "Could not create booking." };
  }

  // Recompute the shop's live queue snapshot from active bookings.
  await refreshQueueSnapshot(supabase, input.shopId);

  return { ok: true, bookingId: booking.id as string };
}

async function refreshQueueSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  shopId: string
) {
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId)
    .in("status", ["booked", "in_queue", "in_service"]);

  const ahead = count ?? 0;
  const status = ahead === 0 ? "quiet" : ahead <= 3 ? "moderate" : "busy";
  await supabase
    .from("shops")
    .update({ queue_people_ahead: ahead, queue_status: status })
    .eq("id", shopId);
}
