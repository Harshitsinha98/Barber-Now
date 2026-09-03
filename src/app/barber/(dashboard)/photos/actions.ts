"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ShopRow } from "@/lib/supabase/database.types";

async function ownedShop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle<ShopRow>();
  if (!data) return null;
  return { shop: data, supabase };
}

/** Set the shop's cover image. */
export async function setCover(formData: FormData) {
  const ctx = await ownedShop();
  if (!ctx) return;
  const url = String(formData.get("url") ?? "");
  if (!url) return;
  await ctx.supabase
    .from("shops")
    .update({ cover_image: url })
    .eq("id", ctx.shop.id);
  revalidatePath("/barber/photos");
  revalidatePath("/barber/dashboard");
}

/** Add an image to the gallery. */
export async function addToGallery(formData: FormData) {
  const ctx = await ownedShop();
  if (!ctx) return;
  const url = String(formData.get("url") ?? "");
  if (!url) return;
  const gallery = [...(ctx.shop.gallery ?? []), url];
  await ctx.supabase
    .from("shops")
    .update({ gallery })
    .eq("id", ctx.shop.id);
  revalidatePath("/barber/photos");
  revalidatePath("/barber/dashboard");
}

/** Remove an image from the gallery. */
export async function removeFromGallery(formData: FormData) {
  const ctx = await ownedShop();
  if (!ctx) return;
  const url = String(formData.get("url") ?? "");
  const gallery = (ctx.shop.gallery ?? []).filter((g) => g !== url);
  await ctx.supabase
    .from("shops")
    .update({ gallery })
    .eq("id", ctx.shop.id);
  revalidatePath("/barber/photos");
  revalidatePath("/barber/dashboard");
}

/** Clear the cover image. */
export async function clearCover() {
  const ctx = await ownedShop();
  if (!ctx) return;
  await ctx.supabase
    .from("shops")
    .update({ cover_image: null })
    .eq("id", ctx.shop.id);
  revalidatePath("/barber/photos");
  revalidatePath("/barber/dashboard");
}
