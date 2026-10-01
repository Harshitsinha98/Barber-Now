import { NextResponse } from "next/server";
import { verifyWebhookSignature, fulfillPayment } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Razorpay webhook (backup path if the browser closes before confirming).
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL:    https://<your-domain>/api/razorpay/webhook
 *   Events: payment.captured, order.paid, payment.failed
 *   Secret: RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string; status?: string; error_description?: string | null };
      };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const p = event.payload?.payment?.entity;
    if (p?.order_id) {
      const db = createAdminClient();
      const { data: pay } = await db
        .from("payments")
        .select("id")
        .eq("razorpay_order_id", p.order_id)
        .maybeSingle();
      if (pay) await fulfillPayment(pay.id as string, { razorpayPaymentId: p.id });
    }
  }

  // A failed attempt doesn't end the order (the customer may retry), so we
  // only record the reason; reconciliation marks it failed if nothing succeeds.
  if (event.event === "payment.failed") {
    const p = event.payload?.payment?.entity;
    if (p?.order_id) {
      await createAdminClient()
        .from("payments")
        .update({ note: `Last attempt failed: ${String(p.error_description ?? "unknown").slice(0, 150)}` })
        .eq("razorpay_order_id", p.order_id)
        .eq("status", "created");
    }
  }
  return NextResponse.json({ ok: true });
}
