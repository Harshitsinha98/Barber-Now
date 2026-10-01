import Link from "next/link";
import { requireBarberShop } from "@/lib/barber";
import type { PaymentRow } from "@/lib/supabase/database.types";
import { PARTNER_PLAN, findPlan, daysLeft, isActive } from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { PayButton } from "@/components/barber/PayButton";
import { Check, Receipt, Rocket, ShieldCheck } from "lucide-react";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default async function BillingPage() {
  const { supabase, shop } = await requireBarberShop();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const payments = ((data as PaymentRow[]) ?? []).filter((p) => p.status !== "created");
  const active = isActive(shop.subscription_until);
  const left = daysLeft(shop.subscription_until);
  const p = PARTNER_PLAN;

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Plan &amp; billing</h1>
        <p className="text-sm text-ink/60">One flat monthly fee. 0% commission on every service.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-cream sm:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/25 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                {p.name}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  active ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {active ? `Active · ${left} day${left === 1 ? "" : "s"} left` : "Inactive — shop hidden"}
              </span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="font-display text-5xl font-extrabold">{formatINR(p.price)}</span>
              <span className="mb-1.5 text-cream/60">/ month · incl. GST</span>
            </div>
            <p className="mt-1 text-sm text-cream/60">
              {active ? `Renews manually · valid till ${fmt(shop.subscription_until)}` : "Activate to show your shop to customers."}
            </p>
            <ul className="mt-6 grid gap-2.5 text-sm sm:grid-cols-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold" /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 max-w-xs">
              <PayButton
                planCode={p.code}
                label={active ? `Extend 30 days · ${formatINR(p.price)}` : `Activate · ${formatINR(p.price)}`}
              />
              {active && <p className="mt-2 text-xs text-cream/50">Paying early adds 30 days on top — you lose nothing.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/barber/growth"
            className="block rounded-3xl bg-gradient-to-br from-gold to-coral p-6 text-ink transition hover:-translate-y-0.5 hover:shadow-premium"
          >
            <Rocket />
            <p className="mt-3 font-display text-xl font-bold">Want more customers?</p>
            <p className="text-sm text-ink/70">Boost your shop to the top of nearby results from ₹299.</p>
          </Link>
          <div className="card p-5 text-sm text-ink/70">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <ShieldCheck size={16} className="text-gold-dark" /> How billing works
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Customers pay you directly at the shop — we never touch your earnings.</li>
              <li>The plan runs 30 days from payment. We remind you 5 days before it ends.</li>
              <li>If it lapses, your shop is hidden until you renew. Nothing is deleted.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="flex items-center gap-2 p-5 pb-3 font-display text-lg font-bold text-ink">
          <Receipt size={18} className="text-gold-dark" /> Payment history
        </h2>
        {payments.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink/50">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-y border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
                <tr>
                  <th className="p-3 pl-5">Date</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Period</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="p-3 pl-5 text-ink/70">{fmt(pay.paid_at ?? pay.created_at)}</td>
                    <td className="p-3 font-medium text-ink">
                      {findPlan(pay.plan_code)?.name ?? pay.plan_code}
                      {pay.method === "manual" && <span className="ml-2 text-xs text-ink/40">(offline)</span>}
                    </td>
                    <td className="p-3 text-xs text-ink/60">
                      {fmt(pay.period_start)} → {fmt(pay.period_end)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge ${
                          pay.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {pay.status === "paid" ? "Paid" : "Failed"}
                      </span>
                    </td>
                    <td className="p-3 pr-5 text-right font-semibold text-ink">{formatINR(pay.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
