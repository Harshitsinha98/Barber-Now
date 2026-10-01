"use server";

import { revalidatePath } from "next/cache";
import { getOwnedShop } from "@/lib/barber";

export type SettingsState = { error: string | null; ok?: boolean };

const str = (fd: FormData, k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function updateShopSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const ctx = await getOwnedShop();
  if (!ctx) return { error: "Not authorised." };

  const name = str(formData, "name", 80);
  const area = str(formData, "area", 80);
  const city = str(formData, "city", 60);
  if (!name || !area || !city) return { error: "Shop name, area and city are required." };

  const avg = Number(formData.get("avgMinutes"));
  const priceLevel = String(formData.get("priceLevel") ?? "2");
  const latRaw = String(formData.get("lat") ?? "");
  const lngRaw = String(formData.get("lng") ?? "");
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;
  const amenities = formData.getAll("amenities").map(String).filter(Boolean).slice(0, 12);

  const { error } = await ctx.supabase
    .from("shops")
    .update({
      name,
      tagline: str(formData, "tagline", 120) || null,
      address: str(formData, "address", 200) || null,
      area,
      city,
      open_hours: str(formData, "openHours", 60) || null,
      price_level: ["1", "2", "3"].includes(priceLevel) ? priceLevel : "2",
      queue_avg_minutes: Number.isFinite(avg) && avg >= 5 && avg <= 180 ? Math.round(avg) : ctx.shop.queue_avg_minutes,
      amenities,
      // Only sent once migration 0008 is applied (the form hides these fields before that).
      ...(formData.has("salonType")
        ? {
            salon_type: ["men", "women", "unisex"].includes(str(formData, "salonType", 10))
              ? str(formData, "salonType", 10)
              : "men",
            female_staff: Boolean(formData.get("femaleStaff")),
          }
        : {}),
      ...(lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
    })
    .eq("id", ctx.shop.id);
  if (error) return { error: error.message };

  revalidatePath("/barber", "layout");
  revalidatePath("/");
  revalidatePath(`/shop/${ctx.shop.slug}`);
  return { error: null, ok: true };
}

/** Turn customer song requests on / off for this shop. */
export async function setSongRequests(on: boolean): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, error: "Not authorised." };
  const { error } = await ctx.supabase
    .from("shops")
    .update({ accepts_song_requests: on })
    .eq("id", ctx.shop.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/barber", "layout");
  revalidatePath(`/shop/${ctx.shop.slug}`);
  return { ok: true };
}
