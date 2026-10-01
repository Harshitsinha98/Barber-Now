"use server";

import { revalidatePath } from "next/cache";
import { getOwnedShop } from "@/lib/barber";

export type ServiceState = { error: string | null; ok?: boolean };

const CATEGORIES = ["hair", "beard", "shave", "spa", "combo", "kids"];

function parse(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const price = Number(formData.get("price"));
  const duration = Number(formData.get("duration"));
  const discountRaw = String(formData.get("discount") ?? "").trim();
  const discount = discountRaw ? Number(discountRaw) : null;
  const category = String(formData.get("category") ?? "hair");
  const description = String(formData.get("description") ?? "").trim().slice(0, 200);

  if (!name || !Number.isFinite(price) || price < 0 || price > 100000) {
    return { error: "Enter a valid service name and price." } as const;
  }
  if (discount != null && (!Number.isFinite(discount) || discount < 0 || discount > 90)) {
    return { error: "Discount must be between 0 and 90%." } as const;
  }
  return {
    values: {
      name,
      price: Math.round(price),
      duration_minutes: Number.isFinite(duration) && duration > 0 ? Math.min(480, Math.round(duration)) : 30,
      discount_percent: discount ? Math.round(discount) : null,
      category: CATEGORIES.includes(category) ? category : "hair",
      description: description || null,
    },
  } as const;
}

function refresh() {
  revalidatePath("/barber", "layout");
  revalidatePath("/");
}

export async function addService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  const ctx = await getOwnedShop();
  if (!ctx) return { error: "Not authorised." };
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error ?? "Invalid input." };

  const { error } = await ctx.supabase
    .from("services")
    .insert({ ...parsed.values, shop_id: ctx.shop.id, is_active: true });
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: true };
}

export async function updateService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  const ctx = await getOwnedShop();
  if (!ctx) return { error: "Not authorised." };
  const id = String(formData.get("id") ?? "");
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error ?? "Invalid input." };

  const { error } = await ctx.supabase
    .from("services")
    .update(parsed.values)
    .eq("id", id)
    .eq("shop_id", ctx.shop.id);
  if (error) return { error: error.message };
  refresh();
  return { error: null, ok: true };
}

export async function deleteService(formData: FormData) {
  const ctx = await getOwnedShop();
  const id = String(formData.get("id") ?? "");
  if (!ctx || !id) return;
  await ctx.supabase.from("services").delete().eq("id", id).eq("shop_id", ctx.shop.id);
  refresh();
}

export async function toggleService(formData: FormData) {
  const ctx = await getOwnedShop();
  const id = String(formData.get("id") ?? "");
  if (!ctx || !id) return;
  const active = String(formData.get("active") ?? "") === "true";
  await ctx.supabase
    .from("services")
    .update({ is_active: !active })
    .eq("id", id)
    .eq("shop_id", ctx.shop.id);
  refresh();
}
