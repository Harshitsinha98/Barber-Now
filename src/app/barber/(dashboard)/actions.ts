"use server";

import { revalidatePath } from "next/cache";
import { getOwnedShop } from "@/lib/barber";

function refresh() {
  revalidatePath("/barber", "layout");
  revalidatePath("/");
}

/** Publish / unpublish. Publishing needs at least one active service. */
export async function setPublished(published: boolean): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, error: "Not authorised." };

  if (published) {
    const { count } = await ctx.supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", ctx.shop.id)
      .eq("is_active", true);
    if ((count ?? 0) === 0) {
      return { ok: false, error: "Add at least one active service before publishing." };
    }
  }

  const { error } = await ctx.supabase
    .from("shops")
    .update({ is_published: published })
    .eq("id", ctx.shop.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Open / close for walk-ins. */
export async function setOpenNow(open: boolean): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, error: "Not authorised." };
  const { error } = await ctx.supabase.from("shops").update({ open_now: open }).eq("id", ctx.shop.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}
