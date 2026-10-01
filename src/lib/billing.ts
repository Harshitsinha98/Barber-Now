import "server-only";
import crypto from "crypto";
import { createAdminClient } from "./supabase/admin";
import type { PaymentRow, ShopRow } from "./supabase/database.types";
import type { Plan } from "./plans";

export const razorpay = {
  keyId: process.env.RAZORPAY_KEY_ID || "",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  get enabled() {
    return Boolean(this.keyId && this.keySecret);
  },
};

/** Constant-time compare of two hex strings. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Signature Razorpay Checkout returns after a successful payment. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!razorpay.keySecret) return false;
  const expected = crypto
    .createHmac("sha256", razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
}

/** X-Razorpay-Signature on webhook calls. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!razorpay.webhookSecret) return false;
  const expected = crypto.createHmac("sha256", razorpay.webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

/** Create a Razorpay order (amount in paise). */
export async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>) {
  const auth = Buffer.from(`${razorpay.keyId}:${razorpay.keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: amountInr * 100, currency: "INR", receipt, notes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.id) {
    throw new Error(data?.error?.description || `Razorpay responded ${res.status}`);
  }
  return data as { id: string; amount: number; currency: string };
}

/** New end date: extend from whichever is later — now or the current end. */
export function extendFrom(current: string | null | undefined, days: number): { start: Date; end: Date } {
  const now = Date.now();
  const base = current && new Date(current).getTime() > now ? new Date(current).getTime() : now;
  return { start: new Date(base), end: new Date(base + days * 864e5) };
}

/**
 * Mark a payment paid and extend the shop's subscription / boost.
 * Idempotent: a payment that is already paid is never applied twice.
 */
export async function fulfillPayment(
  paymentId: string,
  extra: { razorpayPaymentId?: string } = {}
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();

  const { data: pay } = await db.from("payments").select("*").eq("id", paymentId).maybeSingle<PaymentRow>();
  if (!pay) return { ok: false, error: "Payment not found." };
  if (pay.status === "paid") return { ok: true };

  const { data: shop } = await db.from("shops").select("*").eq("id", pay.shop_id).maybeSingle<ShopRow>();
  if (!shop) return { ok: false, error: "Shop not found." };

  const column = pay.kind === "subscription" ? "subscription_until" : "boost_until";
  // A boost can never run past the subscription it sits on.
  const { start, end } = extendFrom(shop[column], pay.days);

  // Claim the payment first (status guard) so a racing webhook can't double-apply.
  const { data: claimed } = await db
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      ...(extra.razorpayPaymentId ? { razorpay_payment_id: extra.razorpayPaymentId } : {}),
    })
    .eq("id", pay.id)
    .neq("status", "paid")
    .select("id");
  if (!claimed || claimed.length === 0) return { ok: true };

  const { error } = await db.from("shops").update({ [column]: end.toISOString() }).eq("id", shop.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Admin: record an offline (UPI/cash) payment and apply it immediately. */
export async function recordManualPayment(shopId: string, plan: Plan, note?: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("payments")
    .insert({
      shop_id: shopId,
      kind: plan.kind,
      plan_code: plan.code,
      amount: plan.price,
      days: plan.days,
      method: "manual",
      note: note || "Activated by admin",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not record payment." };
  return fulfillPayment(data.id as string);
}
