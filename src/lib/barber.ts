import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import type { ShopRow } from "./supabase/database.types";

type Db = Awaited<ReturnType<typeof createClient>>;

export interface BarberContext {
  supabase: Db;
  user: User;
  shop: ShopRow;
}

/** Barber's own shop or null (RLS also limits writes to the owner). */
export async function getOwnedShop(): Promise<BarberContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<ShopRow>();
  if (!shop) return null;
  return { supabase, user, shop };
}

/** For pages: logged-in barber with a shop, else redirect to login/onboarding. */
export async function requireBarberShop(): Promise<BarberContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");
  const ctx = await getOwnedShop();
  if (!ctx) redirect("/barber/onboarding");
  return ctx;
}
