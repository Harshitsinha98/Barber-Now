"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type OnboardState = { error: string | null };

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "shop"
  );
}

/** Create the barber's shop (unpublished draft). */
export async function createShop(
  _prev: OnboardState,
  formData: FormData
): Promise<OnboardState> {
  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const openHours = String(formData.get("openHours") ?? "").trim();
  const priceLevel = String(formData.get("priceLevel") ?? "2");
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;

  if (!name || !area || !city) {
    return { error: "Shop name, area and city are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");

  // Ensure a unique slug.
  const base = slugify(name);
  let slug = base;
  const { data: existing } = await supabase
    .from("shops")
    .select("slug")
    .like("slug", `${base}%`);
  if (existing && existing.length > 0) {
    slug = `${base}-${existing.length + 1}`;
  }

  const { error } = await supabase.from("shops").insert({
    owner_id: user.id,
    slug,
    name,
    tagline: tagline || null,
    address: address || null,
    area,
    city,
    open_hours: openHours || null,
    price_level: ["1", "2", "3"].includes(priceLevel) ? priceLevel : "2",
    lat,
    lng,
    is_published: false,
    open_now: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/barber", "layout");
  redirect("/barber/dashboard");
}
