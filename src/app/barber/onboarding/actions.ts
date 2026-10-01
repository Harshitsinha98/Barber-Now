"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedShop } from "@/lib/barber";
import { PAN_RE, GSTIN_RE, PINCODE_RE } from "@/lib/plans";

export type OnboardState = { error: string | null; ok?: boolean };

const str = (fd: FormData, k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);

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

function refresh() {
  revalidatePath("/barber", "layout");
}

/** Step 1 — create the shop, or update its details if it already exists. */
export async function saveShopDetails(_prev: OnboardState, fd: FormData): Promise<OnboardState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/barber/login");

  const name = str(fd, "name", 80);
  const ownerName = str(fd, "ownerName", 60);
  const area = str(fd, "area", 80);
  const city = str(fd, "city", 60);
  const pincode = str(fd, "pincode", 6);
  if (!name || !ownerName || !area || !city) {
    return { error: "Shop name, owner name, area and city are required." };
  }
  if (pincode && !PINCODE_RE.test(pincode)) return { error: "Enter a valid 6-digit pincode." };

  const lat = fd.get("lat") ? Number(fd.get("lat")) : null;
  const lng = fd.get("lng") ? Number(fd.get("lng")) : null;
  const opens = str(fd, "opens", 10);
  const closes = str(fd, "closes", 10);
  const weeklyOff = str(fd, "weeklyOff", 12);
  const openHours =
    opens && closes ? `${opens} – ${closes}${weeklyOff && weeklyOff !== "none" ? ` · Closed ${weeklyOff}` : ""}` : null;
  const priceLevel = str(fd, "priceLevel", 1);

  const values = {
    name,
    owner_name: ownerName,
    tagline: str(fd, "tagline", 120) || null,
    address: str(fd, "address", 200) || null,
    area,
    city,
    pincode: pincode || null,
    open_hours: openHours,
    price_level: ["1", "2", "3"].includes(priceLevel) ? priceLevel : "2",
    ...(lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : {}),
  };

  const ctx = await getOwnedShop();
  if (ctx) {
    const { error } = await supabase.from("shops").update(values).eq("id", ctx.shop.id);
    if (error) return { error: error.message };
  } else {
    const base = slugify(name);
    const { data: existing } = await supabase.from("shops").select("slug").like("slug", `${base}%`);
    const slug = existing && existing.length > 0 ? `${base}-${existing.length + 1}` : base;
    const { error } = await supabase
      .from("shops")
      .insert({ ...values, owner_id: user.id, slug, is_published: true, open_now: true });
    if (error) return { error: error.message };
    await supabase.from("profiles").update({ role: "barber", full_name: ownerName }).eq("id", user.id);
  }

  refresh();
  redirect("/barber/onboarding?step=2");
}

/** Step 4 — business documents. */
export async function saveDocuments(_prev: OnboardState, fd: FormData): Promise<OnboardState> {
  const ctx = await getOwnedShop();
  if (!ctx) return { error: "Create your shop first." };

  const pan = str(fd, "pan", 10).toUpperCase();
  const gstin = str(fd, "gstin", 15).toUpperCase();
  if (!PAN_RE.test(pan)) return { error: "Enter a valid PAN, e.g. ABCDE1234F." };
  if (gstin && !GSTIN_RE.test(gstin)) return { error: "That GSTIN doesn't look right (15 characters)." };
  if (!fd.get("consent")) return { error: "Please accept the partner terms to continue." };

  const { error } = await ctx.supabase
    .from("shops")
    .update({ pan_number: pan, gstin: gstin || null })
    .eq("id", ctx.shop.id);
  if (error) return { error: error.message };
  refresh();
  redirect("/barber/onboarding?step=5");
}

/** Save the storage path of an uploaded KYC document (private bucket). */
export async function saveKycDocPath(path: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, error: "Not authorised." };
  // Uploads are only allowed into the owner's own folder (storage policy).
  if (!path.startsWith(`${ctx.user.id}/`)) return { ok: false, error: "Invalid file." };
  const { error } = await ctx.supabase.from("shops").update({ kyc_doc_path: path }).eq("id", ctx.shop.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

/** Requirements before a shop can be sent for review. */
export async function onboardingChecklist() {
  const ctx = await getOwnedShop();
  if (!ctx) return null;
  const { count } = await ctx.supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", ctx.shop.id)
    .eq("is_active", true);
  return {
    ctx,
    details: true,
    services: (count ?? 0) > 0,
    photos: Boolean(ctx.shop.cover_image),
    documents: Boolean(ctx.shop.pan_number),
  };
}

/** Final step — send for BarberNow review. */
export async function submitForReview(): Promise<{ ok: boolean; error?: string }> {
  const c = await onboardingChecklist();
  if (!c) return { ok: false, error: "Create your shop first." };
  if (!c.services) return { ok: false, error: "Add at least one service." };
  if (!c.photos) return { ok: false, error: "Upload a cover photo." };
  if (!c.documents) return { ok: false, error: "Add your PAN in Documents." };
  if (c.ctx.shop.onboarding_status === "approved") return { ok: true };

  // Status columns are protected from barbers — write via the service role.
  const { error } = await createAdminClient()
    .from("shops")
    .update({ onboarding_status: "submitted", submitted_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", c.ctx.shop.id);
  if (error) return { ok: false, error: error.message };
  refresh();
  revalidatePath("/admin", "layout");
  return { ok: true };
}
