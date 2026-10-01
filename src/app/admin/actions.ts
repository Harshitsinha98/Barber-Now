"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { findPlan } from "@/lib/plans";
import { recordManualPayment } from "@/lib/billing";

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

/** Approve a submitted shop → verified partner. Goes live once the plan is active. */
export async function adminApproveShop(fd: FormData) {
  const admin = await getAdmin();
  const id = String(fd.get("id") ?? "");
  if (!admin || !id) return;
  await admin.db
    .from("shops")
    .update({
      onboarding_status: "approved",
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      is_verified: true,
      is_published: true,
    })
    .eq("id", id);
  refresh();
  revalidatePath("/barber", "layout");
}

/** Send a shop back to the barber with a reason. */
export async function adminRejectShop(fd: FormData) {
  const admin = await getAdmin();
  const id = String(fd.get("id") ?? "");
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 300);
  if (!admin || !id) return;
  await admin.db
    .from("shops")
    .update({ onboarding_status: "rejected", rejection_reason: reason || "Please review your details." })
    .eq("id", id);
  refresh();
  revalidatePath("/barber", "layout");
}

/** Record an offline (UPI / cash) payment for a plan or boost and apply it. */
export async function adminRecordPayment(fd: FormData) {
  const admin = await getAdmin();
  const id = String(fd.get("id") ?? "");
  const plan = findPlan(String(fd.get("plan") ?? ""));
  if (!admin || !id || !plan) return;
  const ref = String(fd.get("note") ?? "").trim().slice(0, 120);
  await recordManualPayment(id, plan, ref ? `Offline: ${ref}` : "Offline payment recorded by admin");
  refresh();
  revalidatePath("/barber", "layout");
}

/** Short-lived link to view a shop's private KYC document. */
export async function adminKycLink(path: string): Promise<string | null> {
  const admin = await getAdmin();
  if (!admin || !path) return null;
  const { data } = await admin.db.storage.from("kyc-docs").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
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
