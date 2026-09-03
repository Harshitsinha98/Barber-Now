"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ServiceState = { error: string | null; ok?: boolean };

async function ownedShop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { shopId: data.id as string, supabase };
}

const CATEGORIES = ["hair", "beard", "shave", "spa", "combo", "kids"];

/** Add a new service to the barber's shop. */
export async function addService(
  _prev: ServiceState,
  formData: FormData
): Promise<ServiceState> {
  const ctx = await ownedShop();
  if (!ctx) return { error: "Not authorised." };

  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const duration = Number(formData.get("duration"));
  const discountRaw = String(formData.get("discount") ?? "").trim();
  const discount = discountRaw ? Number(discountRaw) : null;
  const category = String(formData.get("category") ?? "hair");
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid service name and price." };
  }
  if (discount != null && (discount < 0 || discount > 90)) {
    return { error: "Discount must be between 0 and 90%." };
  }

  const { error } = await ctx.supabase.from("services").insert({
    shop_id: ctx.shopId,
    name,
    price: Math.round(price),
    duration_minutes: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 30,
    discount_percent: discount,
    category: CATEGORIES.includes(category) ? category : "hair",
    description: description || null,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/barber/services");
  return { error: null, ok: true };
}

/** Delete a service. */
export async function deleteService(formData: FormData) {
  const ctx = await ownedShop();
  if (!ctx) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await ctx.supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("shop_id", ctx.shopId);
  revalidatePath("/barber/services");
}

/** Toggle a service active/inactive. */
export async function toggleService(formData: FormData) {
  const ctx = await ownedShop();
  if (!ctx) return;
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (!id) return;
  await ctx.supabase
    .from("services")
    .update({ is_active: !active })
    .eq("id", id)
    .eq("shop_id", ctx.shopId);
  revalidatePath("/barber/services");
}
