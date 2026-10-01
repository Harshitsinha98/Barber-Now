"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
}

async function updateShop(formData: FormData, patch: Record<string, boolean>) {
  const admin = await getAdmin();
  const id = String(formData.get("id") ?? "");
  if (!admin || !id) return;
  await admin.db.from("shops").update(patch).eq("id", id);
  refresh();
}

const flag = (fd: FormData) => String(fd.get("value") ?? "") === "true";

export async function adminSetVerified(fd: FormData) {
  await updateShop(fd, { is_verified: flag(fd) });
}
export async function adminSetSuspended(fd: FormData) {
  await updateShop(fd, { is_suspended: flag(fd) });
}
export async function adminSetPublished(fd: FormData) {
  await updateShop(fd, { is_published: flag(fd) });
}

export async function adminCancelBooking(fd: FormData) {
  const admin = await getAdmin();
  const id = String(fd.get("id") ?? "");
  if (!admin || !id) return;
  await admin.db
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .in("status", ["booked", "in_queue", "in_service"]);
  refresh();
}

export async function adminDeleteReview(fd: FormData) {
  const admin = await getAdmin();
  const id = String(fd.get("id") ?? "");
  if (!admin || !id) return;
  await admin.db.from("reviews").delete().eq("id", id);
  refresh();
}

export async function adminLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
