"use server";

import { revalidatePath } from "next/cache";
import { getOwnedShop } from "@/lib/barber";
import { createAdminClient } from "@/lib/supabase/admin";
import { findPlan, isActive } from "@/lib/plans";
import {
  razorpay,
  createRazorpayOrder,
  verifyCheckoutSignature,
  fulfillPayment,
  syncPaymentWithRazorpay,
} from "@/lib/billing";
import type { PaymentRow } from "@/lib/supabase/database.types";

export type CheckoutStart =
  | {
      ok: true;
      keyId: string;
      orderId: string;
      amount: number; // paise
      name: string;
      description: string;
      prefill: { name: string; contact: string };
    }
  | { ok: false; error: string; offline?: boolean };

/** Start a Razorpay checkout for the partner plan or a boost pack. */
export async function startCheckout(planCode: string): Promise<CheckoutStart> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, error: "Please sign in again." };

  const plan = findPlan(planCode);
  if (!plan) return { ok: false, error: "Unknown plan." };

  if (plan.kind === "boost" && !isActive(ctx.shop.subscription_until)) {
    return { ok: false, error: "Activate your ₹1,499 partner plan first — boosts sit on top of it." };
  }
  if (!razorpay.enabled) {
    return {
      ok: false,
      offline: true,
      error:
        "Online payments aren't switched on yet. Pay via UPI to BarberNow and our team will activate it for you.",
    };
  }

  const db = createAdminClient();
  const { data: payment, error } = await db
    .from("payments")
    .insert({
      shop_id: ctx.shop.id,
      kind: plan.kind,
      plan_code: plan.code,
      amount: plan.price,
      days: plan.days,
      method: "razorpay",
    })
    .select("id")
    .single();
  if (error || !payment) return { ok: false, error: error?.message ?? "Could not start payment." };

  try {
    const order = await createRazorpayOrder(plan.price, `bn_${String(payment.id).slice(0, 30)}`, {
      payment_id: String(payment.id),
      shop_id: ctx.shop.id,
      plan: plan.code,
    });
    await db.from("payments").update({ razorpay_order_id: order.id }).eq("id", payment.id);
    return {
      ok: true,
      keyId: razorpay.keyId,
      orderId: order.id,
      amount: order.amount,
      name: "BarberNow",
      description: `${plan.name} · ${plan.days} days`,
      prefill: {
        name: ctx.shop.owner_name || ctx.shop.name,
        contact: String(ctx.user.phone || "").replace(/\D/g, "").slice(-10),
      },
    };
  } catch (e) {
    await db.from("payments").update({ status: "failed", note: (e as Error).message }).eq("id", payment.id);
    return { ok: false, error: "Payment gateway error. Please try again." };
  }
}

/** Called by the browser after Razorpay Checkout succeeds. */
export async function confirmCheckout(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, error: "Please sign in again." };
  if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) {
    return { ok: false, error: "Payment could not be verified. If money was debited, it will be confirmed shortly." };
  }

  const db = createAdminClient();
  const { data: pay } = await db
    .from("payments")
    .select("*")
    .eq("razorpay_order_id", input.orderId)
    .eq("shop_id", ctx.shop.id)
    .maybeSingle<PaymentRow>();
  if (!pay) return { ok: false, error: "Payment record not found." };

  const res = await fulfillPayment(pay.id, { razorpayPaymentId: input.paymentId });
  revalidatePath("/barber", "layout");
  return res;
}

/** "Money got debited but plan isn't active?" — re-check a pending payment. */
export async function checkPaymentStatus(paymentId: string): Promise<{ ok: boolean; status: string; error?: string }> {
  const ctx = await getOwnedShop();
  if (!ctx) return { ok: false, status: "unknown", error: "Please sign in again." };
  const db = createAdminClient();
  const { data: pay } = await db
    .from("payments")
    .select("id")
    .eq("id", paymentId)
    .eq("shop_id", ctx.shop.id)
    .maybeSingle();
  if (!pay) return { ok: false, status: "unknown", error: "Payment not found." };
  const res = await syncPaymentWithRazorpay(paymentId);
  revalidatePath("/barber", "layout");
  return res;
}
