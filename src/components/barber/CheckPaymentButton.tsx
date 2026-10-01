"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { checkPaymentStatus } from "@/app/barber/billing-actions";

export function CheckPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await checkPaymentStatus(paymentId);
            setMsg(
              !r.ok
                ? r.error ?? "Couldn't check."
                : r.status === "paid"
                  ? "Confirmed ✓"
                  : r.status === "failed"
                    ? "Payment didn't go through."
                    : "Still pending with the bank. Try again in a few minutes."
            );
            router.refresh();
          })
        }
        className="btn-outline px-3 py-1.5 text-xs"
      >
        {pending ? <LoaderCircle size={13} className="animate-spin" /> : <RefreshCw size={13} />} Check status
      </button>
      {msg && <span className="mt-1 text-[11px] text-ink/60">{msg}</span>}
    </span>
  );
}
