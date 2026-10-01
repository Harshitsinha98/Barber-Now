import { requireAdmin } from "@/lib/admin-auth";
import type { PaymentRow, ShopRow } from "@/lib/supabase/database.types";
import { razorpay, razorpayMode } from "@/lib/billing";
import { findPlan } from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { PageHeader, FilterTabs, Empty } from "@/components/admin/ui";
import { adminSyncPayment, adminSyncAllPending } from "../../actions";
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : "—";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const { db } = await requireAdmin();

  const [{ data: payData }, { data: shopData }] = await Promise.all([
    db.from("payments").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("shops").select("id, name, city"),
  ]);
  const all = (payData as PaymentRow[]) ?? [];
  const shops = new Map(((shopData as Pick<ShopRow, "id" | "name" | "city">[]) ?? []).map((s) => [s.id, s]));
  const list = all.filter((p) =>
    status === "all" ? true : status === "pending" ? p.status === "created" : p.status === status
  );

  const mode = razorpayMode();
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://<your-domain>").replace(/\/$/, "");
  const paid = all.filter((p) => p.status === "paid");
  const pendingCount = all.filter((p) => p.status === "created" && p.razorpay_order_id).length;

  return (
    <div className="space-y-5 p-5 sm:p-8">
      <PageHeader title="Payments" subtitle="Partner plans & boosts collected through Razorpay or offline." />

      {/* Gateway health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Health ok={razorpay.enabled} title="API keys" detail={razorpay.enabled ? `Connected · ${mode === "live" ? "LIVE mode" : "TEST mode"}` : "RAZORPAY_KEY_ID / KEY_SECRET missing — barbers see 'pay offline'"} />
        <Health ok={Boolean(razorpay.webhookSecret)} title="Webhook" detail={razorpay.webhookSecret ? `${site}/api/razorpay/webhook` : "RAZORPAY_WEBHOOK_SECRET missing — payments rely on the browser callback only"} />
        <Health
          ok={mode === "live"}
          warn={mode === "test"}
          title="Mode"
          detail={mode === "live" ? "Real money is being collected" : mode === "test" ? "Test mode — no real money. Switch to rzp_live_ keys to go live." : "Not configured"}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          base="/admin/payments"
          param="status"
          current={status}
          options={[
            { value: "all", label: "All", count: all.length },
            { value: "paid", label: "Paid", count: paid.length },
            { value: "pending", label: "Pending", count: all.filter((p) => p.status === "created").length },
            { value: "failed", label: "Failed", count: all.filter((p) => p.status === "failed").length },
          ]}
        />
        {razorpay.enabled && pendingCount > 0 && (
          <form action={adminSyncAllPending}>
            <button className="btn-outline px-4 py-2 text-xs">
              <RefreshCw size={14} /> Reconcile {pendingCount} pending with Razorpay
            </button>
          </form>
        )}
      </div>

      {list.length === 0 ? (
        <Empty>No payments here yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
              <tr>
                <th className="p-3">Created</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Item</th>
                <th className="p-3">Method</th>
                <th className="p-3">Razorpay</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {list.map((p) => (
                <tr key={p.id} className="align-top hover:bg-black/[0.02]">
                  <td className="p-3 text-xs text-ink/60">{fmt(p.created_at)}</td>
                  <td className="p-3 font-medium text-ink">{shops.get(p.shop_id)?.name ?? "—"}</td>
                  <td className="p-3 text-ink/70">
                    {findPlan(p.plan_code)?.name ?? p.plan_code} · {p.days}d
                    {p.note && <p className="max-w-[220px] truncate text-[11px] text-ink/40" title={p.note}>{p.note}</p>}
                  </td>
                  <td className="p-3 text-xs text-ink/60">{p.method === "razorpay" ? "Online" : "Offline"}</td>
                  <td className="p-3 font-mono text-[11px] text-ink/50">
                    {p.razorpay_order_id ?? "—"}
                    {p.razorpay_payment_id && <div>{p.razorpay_payment_id}</div>}
                  </td>
                  <td className="p-3">
                    <span
                      className={`badge ${
                        p.status === "paid" ? "bg-emerald-50 text-emerald-700" : p.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.status === "created" ? "Pending" : p.status === "paid" ? "Paid" : "Failed"}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-ink">{formatINR(p.amount)}</td>
                  <td className="p-3 text-right">
                    {p.status === "created" && p.razorpay_order_id && razorpay.enabled && (
                      <form action={adminSyncPayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5 hover:text-ink" title="Check with Razorpay">
                          <RefreshCw size={15} />
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Health({ ok, warn, title, detail }: { ok: boolean; warn?: boolean; title: string; detail: string }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  return (
    <div className="card flex items-start gap-3 p-4">
      <Icon size={20} className={ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-rose-600"} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="break-words text-xs text-ink/60">{detail}</p>
      </div>
    </div>
  );
}
