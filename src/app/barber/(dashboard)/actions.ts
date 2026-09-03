"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ownedShopId(): Promise<{ shopId: string; supabase: Awaited<ReturnType<typeof createClient>> } | null> {
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

/** Publish / unpublish the shop (visible to customers when published). */
export async function setPublished(published: boolean) {
  const ctx = await ownedShopId();
  if (!ctx) return;
  await ctx.supabase
    .from("shops")
    .update({ is_published: published })
    .eq("id", ctx.shopId);
  revalidatePath("/barber/dashboard");
}

/** Toggle open/closed status. */
export async function setOpenNow(open: boolean) {
  const ctx = await ownedShopId();
  if (!ctx) return;
  await ctx.supabase
    .from("shops")
    .update({ open_now: open })
    .eq("id", ctx.shopId);
  revalidatePath("/barber/dashboard");
}
