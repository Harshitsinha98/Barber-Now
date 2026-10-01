"use server";

import { revalidatePath } from "next/cache";
import { getOwnedShop } from "@/lib/barber";

export type TeamState = { error: string | null; ok?: boolean };

function refresh() {
  revalidatePath("/barber/team");
  revalidatePath("/barber/queue");
  revalidatePath("/");
}

export async function addBarber(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const ctx = await getOwnedShop();
  if (!ctx) return { error: "Not authorised." };

  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const years = Number(formData.get("experience") ?? 0);
  const specialities = String(formData.get("specialities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (name.length < 2) return { error: "Enter the barber's name." };

  const { error } = await ctx.supabase.from("barbers").insert({
    shop_id: ctx.shop.id,
    name,
    experience_years: Number.isFinite(years) && years >= 0 ? Math.min(60, Math.round(years)) : 0,
    specialities,
    is_active: true,
  });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: true };
}

export async function toggleBarber(formData: FormData) {
  const ctx = await getOwnedShop();
  const id = String(formData.get("id") ?? "");
  if (!ctx || !id) return;
  const active = String(formData.get("active") ?? "") === "true";
  await ctx.supabase.from("barbers").update({ is_active: !active }).eq("id", id).eq("shop_id", ctx.shop.id);
  refresh();
}

export async function removeBarber(formData: FormData) {
  const ctx = await getOwnedShop();
  const id = String(formData.get("id") ?? "");
  if (!ctx || !id) return;
  await ctx.supabase.from("barbers").delete().eq("id", id).eq("shop_id", ctx.shop.id);
  refresh();
}
