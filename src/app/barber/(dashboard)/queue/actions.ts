"use server";

import { revalidatePath } from "next/cache";
import { getOwnedShop } from "@/lib/barber";
import type { BookingStatus } from "@/lib/supabase/database.types";

// Allowed transitions — stops e.g. a finished visit being re-opened.
const FROM: Record<string, BookingStatus[]> = {
  in_service: ["booked", "in_queue"],
  done: ["booked", "in_queue", "in_service"],
  no_show: ["booked", "in_queue"],
  cancelled: ["booked", "in_queue", "in_service"],
};

function refresh() {
  revalidatePath("/barber", "layout");
  revalidatePath("/");
}

async function setStatus(formData: FormData, status: BookingStatus) {
  const ctx = await getOwnedShop();
  const id = String(formData.get("id") ?? "");
  if (!ctx || !id) return;
  // Queue snapshot is recomputed by the bookings trigger.
  await ctx.supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .eq("shop_id", ctx.shop.id)
    .in("status", FROM[status]);
  refresh();
}

export async function startService(fd: FormData) {
  await setStatus(fd, "in_service");
}
export async function markDone(fd: FormData) {
  await setStatus(fd, "done");
}
export async function skipBooking(fd: FormData) {
  await setStatus(fd, "no_show");
}
export async function cancelBooking(fd: FormData) {
  await setStatus(fd, "cancelled");
}

export type WalkInState = { error: string | null; ok?: boolean };

/** Barber adds a customer who walked in without the app. */
export async function addWalkIn(_prev: WalkInState, formData: FormData): Promise<WalkInState> {
  const ctx = await getOwnedShop();
  if (!ctx) return { error: "Not authorised." };

  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || "Walk-in";
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(-10);
  const serviceIds = formData.getAll("services").map(String).filter(Boolean);
  const barberId = String(formData.get("barber") ?? "") || null;
  if (serviceIds.length === 0) return { error: "Pick at least one service." };

  const { data: services } = await ctx.supabase
    .from("services")
    .select("id, price, discount_percent")
    .eq("shop_id", ctx.shop.id)
    .in("id", serviceIds);
  const total = (services ?? []).reduce(
    (sum, s) =>
      sum + (s.discount_percent ? Math.round(s.price * (1 - s.discount_percent / 100)) : s.price),
    0
  );

  const { error } = await ctx.supabase.from("bookings").insert({
    shop_id: ctx.shop.id,
    customer_id: null,
    customer_name: name,
    customer_phone: phone.length === 10 ? phone : null,
    barber_id: barberId,
    service_ids: serviceIds,
    mode: "queue",
    status: "in_queue",
    total_amount: total,
  });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: true };
}
