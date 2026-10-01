import { requireAdmin } from "@/lib/admin-auth";
import type { BookingRow, ShopRow } from "@/lib/supabase/database.types";
import { formatINR, BOOKING_STATUS_LABEL } from "@/lib/utils";
import { formatPhone } from "@/lib/auth";
import { PageHeader, FilterTabs, SearchBox, Empty } from "@/components/admin/ui";
import { adminCancelBooking } from "../../actions";
import { Smartphone, Footprints, X } from "lucide-react";

const STATUSES = ["all", "active", "done", "cancelled", "no_show"] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const { db } = await requireAdmin();

  let query = db.from("bookings").select("*").order("created_at", { ascending: false }).limit(300);
  if (status === "active") query = query.in("status", ["booked", "in_queue", "in_service"]);
  else if (status !== "all") query = query.eq("status", status);

  const [{ data: bookingData }, { data: shopData }] = await Promise.all([
    query,
    db.from("shops").select("id, name, city"),
  ]);
  const shops = new Map(((shopData as Pick<ShopRow, "id" | "name" | "city">[]) ?? []).map((s) => [s.id, s]));
  const term = q.trim().toLowerCase();
  const bookings = ((bookingData as BookingRow[]) ?? []).filter(
    (b) =>
      !term ||
      [b.customer_name, b.customer_phone, shops.get(b.shop_id)?.name, b.id.slice(0, 6)].some((v) =>
        String(v ?? "").toLowerCase().includes(term)
      )
  );
  const total = bookings.filter((b) => b.status === "done").reduce((a, b) => a + b.total_amount, 0);

  return (
    <div className="space-y-5 p-5 sm:p-8">
      <PageHeader title="Bookings" subtitle={`${bookings.length} shown · ${formatINR(total)} completed value (latest 300)`}>
        <SearchBox action="/admin/bookings" defaultValue={q} placeholder="Customer, phone, shop, ID…" hidden={{ status: status !== "all" ? status : undefined }} />
      </PageHeader>

      <FilterTabs
        base="/admin/bookings"
        param="status"
        current={status}
        extra={{ q: q || undefined }}
        options={STATUSES.map((s) => ({
          value: s,
          label: s === "all" ? "All" : s === "active" ? "Active" : BOOKING_STATUS_LABEL[s].label,
        }))}
      />

      {bookings.length === 0 ? (
        <Empty>No bookings found.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-ink/40">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Shop</th>
                <th className="p-3">Type</th>
                <th className="p-3">When</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {bookings.map((b) => {
                const meta = BOOKING_STATUS_LABEL[b.status];
                const active = ["booked", "in_queue", "in_service"].includes(b.status);
                return (
                  <tr key={b.id} className="hover:bg-black/[0.02]">
                    <td className="p-3 font-mono text-xs text-ink/50">BN{b.id.slice(0, 6).toUpperCase()}</td>
                    <td className="p-3">
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        {b.customer_id ? <Smartphone size={12} className="text-blue-600" /> : <Footprints size={12} className="text-ink/40" />}
                        {b.customer_name || "Customer"}
                      </p>
                      {b.customer_phone && <p className="text-xs text-ink/50">{formatPhone(b.customer_phone)}</p>}
                    </td>
                    <td className="p-3 text-ink/70">{shops.get(b.shop_id)?.name ?? "—"}</td>
                    <td className="p-3 text-ink/70">{b.mode === "slot" ? `Slot ${b.slot_time ?? ""}` : "Queue"}</td>
                    <td className="p-3 text-xs text-ink/60">
                      {new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="p-3"><span className={`badge ${meta.cls}`}>{meta.label}</span></td>
                    <td className="p-3 text-right font-semibold text-ink">{formatINR(b.total_amount)}</td>
                    <td className="p-3 text-right">
                      {active && (
                        <form action={adminCancelBooking}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="rounded-lg p-1.5 text-ink/40 hover:bg-rose-50 hover:text-rose-600" title="Cancel booking">
                            <X size={15} />
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
