import { NextResponse } from "next/server";
import { verifyWebhookSignature, fulfillPayment } from "@/lib/billing";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Razorpay webhook (backup path if the browser closes before confirming).
 * Configure in Razorpay Dashboard → Webhooks:
 *   URL:    https://<your-domain>/api/razorpay/webhook
 *   Events: payment.captured, order.paid
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
    payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } };
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
  return NextResponse.json({ ok: true });
}
