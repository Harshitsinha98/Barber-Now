"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Called right after a barber logs in via OTP. Marks their profile role as
 * 'barber' (idempotent), then sends them to onboarding or the dashboard
 * depending on whether they already have a shop.
 */
export async function completeBarberLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");

  // Mark as barber (safe to run every login).
  await supabase.from("profiles").update({ role: "barber" }).eq("id", user.id);

  // Do they already own a shop?
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  revalidatePath("/barber", "layout");
  redirect(shop ? "/barber/dashboard" : "/barber/onboarding");
}

/** Log out and return to the barber login page. */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/barber/login");
}
