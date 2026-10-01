"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { startCheckout, confirmCheckout } from "@/app/barber/billing-actions";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout for a plan code; refreshes the page on success. */
export function PayButton({
  planCode,
  label,
  className = "btn-gold w-full",
  onPaid,
}: {
  planCode: string;
  label: string;
  className?: string;
  onPaid?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "error" | "info" | "ok" } | null>(null);

  async function pay() {
    setBusy(true);
    setMsg(null);
    const start = await startCheckout(planCode);
    if (!start.ok) {
      setMsg({ text: start.error, tone: start.offline ? "info" : "error" });
      setBusy(false);
      return;
    }
    if (!(await loadCheckout()) || !window.Razorpay) {
      setMsg({ text: "Couldn't load the payment window. Check your internet and retry.", tone: "error" });
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: start.keyId,
      order_id: start.orderId,
      amount: start.amount,
      currency: "INR",
      name: start.name,
      description: start.description,
      prefill: start.prefill,
      theme: { color: "#ffb020" },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (r: RazorpayResponse) => {
        const res = await confirmCheckout({
          orderId: r.razorpay_order_id,
          paymentId: r.razorpay_payment_id,
          signature: r.razorpay_signature,
        });
        setBusy(false);
        if (res.ok) {
          setMsg({ text: "Payment successful 🎉", tone: "ok" });
          onPaid?.();
          router.refresh();
        } else {
          setMsg({ text: res.error ?? "Payment not confirmed.", tone: "error" });
        }
      },
    });
    rzp.on("payment.failed", () => {
      setBusy(false);
      setMsg({ text: "Payment failed. No money was taken — please try again.", tone: "error" });
    });
    rzp.open();
  }

  return (
    <div>
      <button type="button" onClick={pay} disabled={busy} className={className}>
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : label}
      </button>
      {msg && (
        <p
          className={`mt-2 text-xs ${
            msg.tone === "error" ? "text-rose-600" : msg.tone === "ok" ? "text-emerald-600" : "text-amber-700"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
