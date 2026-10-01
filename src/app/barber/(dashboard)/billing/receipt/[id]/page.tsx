import { notFound } from "next/navigation";
import { requireBarberShop } from "@/lib/barber";
import type { PaymentRow } from "@/lib/supabase/database.types";
import { findPlan } from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { PrintButton } from "@/components/PrintButton";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

/** Printable payment receipt (Save as PDF from the browser's print dialog). */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, shop } = await requireBarberShop();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shop.id)
    .eq("status", "paid")
    .maybeSingle<PaymentRow>();
  if (!data) notFound();
  const plan = findPlan(data.plan_code);
  const receiptNo = `BN-${new Date(data.paid_at ?? data.created_at).getFullYear()}-${data.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white p-8 print:border-0 print:p-0 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-extrabold">
              barber<span className="text-gold-dark">now</span>
            </p>
            <p className="text-xs text-ink/50">support@barbernow.in</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold text-ink">Payment receipt</p>
            <p className="font-mono text-xs text-ink/50">{receiptNo}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/40">Billed to</p>
            <p className="mt-1 font-semibold text-ink">{shop.name}</p>
            {shop.owner_name && <p className="text-ink/70">{shop.owner_name}</p>}
            <p className="text-ink/70">{[shop.address, shop.area, shop.city, shop.pincode].filter(Boolean).join(", ")}</p>
            {shop.gstin && <p className="text-ink/70">GSTIN: {shop.gstin}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wide text-ink/40">Paid on</p>
            <p className="mt-1 font-semibold text-ink">{fmt(data.paid_at)}</p>
            <p className="text-ink/70">
              {data.method === "razorpay" ? "Online (Razorpay)" : "Offline (UPI / cash)"}
            </p>
            {data.razorpay_payment_id && <p className="font-mono text-xs text-ink/50">{data.razorpay_payment_id}</p>}
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="border-y border-black/10 text-left text-xs uppercase tracking-wide text-ink/40">
            <tr>
              <th className="py-2">Description</th>
              <th className="py-2">Period</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5">
              <td className="py-3 font-medium text-ink">
                {plan?.name ?? data.plan_code} ({data.days} days)
              </td>
              <td className="py-3 text-ink/70">
                {fmt(data.period_start)} – {fmt(data.period_end)}
              </td>
              <td className="py-3 text-right font-semibold text-ink">{formatINR(data.amount)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <div className="w-56 text-sm">
            <div className="flex justify-between border-t border-black/10 pt-2 font-bold text-ink">
              <span>Total paid</span>
              <span>{formatINR(data.amount)}</span>
            </div>
            <p className="mt-1 text-right text-[11px] text-ink/40">Inclusive of applicable taxes</p>
          </div>
        </div>

        <p className="mt-10 text-xs text-ink/40">
          This is a payment receipt, not a tax invoice. 0% commission is charged on your services.
        </p>
      </div>
      <div className="mx-auto mt-4 flex max-w-2xl justify-end print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
