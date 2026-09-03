"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type BookingStatus =
  | "booked"
  | "in_queue"
  | "in_service"
  | "done"
  | "cancelled"
  | "no_show";

async function ownedShop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("shops")
    .select("id, queue_avg_minutes")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { shopId: data.id as string, supabase };
}

/**
 * Recompute the shop's live queue snapshot (people ahead + status) from the
 * count of active bookings. Called after every queue mutation so the customer
 * side stays accurate.
 */
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

async function updateStatus(bookingId: string, status: BookingStatus) {
  const ctx = await ownedShop();
  if (!ctx || !bookingId) return;
  await ctx.supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("shop_id", ctx.shopId);
  await refreshQueueSnapshot(ctx.supabase, ctx.shopId);
  revalidatePath("/barber/queue");
  revalidatePath("/barber/dashboard");
}

export async function startService(formData: FormData) {
  await updateStatus(String(formData.get("id") ?? ""), "in_service");
}
export async function markDone(formData: FormData) {
  await updateStatus(String(formData.get("id") ?? ""), "done");
}
export async function skipBooking(formData: FormData) {
  await updateStatus(String(formData.get("id") ?? ""), "no_show");
}
export async function cancelBooking(formData: FormData) {
  await updateStatus(String(formData.get("id") ?? ""), "cancelled");
}
