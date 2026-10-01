import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import type { BookingRow, ShopRow } from "@/lib/supabase/database.types";
import { formatINR, BOOKING_STATUS_LABEL } from "@/lib/utils";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { Store, Users, CalendarClock, IndianRupee, ShieldAlert, Scissors, TrendingUp } from "lucide-react";

const istDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

export default async function AdminOverview() {
  const { db } = await requireAdmin();
  const today = istDate(new Date());
  const since = istDate(new Date(Date.now() - 29 * 864e5));

  const head = { count: "exact" as const, head: true };
  const [
    { count: liveShops },
    { count: allShops },
    { count: pending },
    { count: customers },
    { count: barbers },
    { data: shopsData },
    { data: monthData },
  ] = await Promise.all([
    db.from("shops").select("id", head).eq("is_published", true).eq("is_suspended", false),
    db.from("shops").select("id", head),
    db.from("shops").select("id", head).eq("is_published", true).eq("is_verified", false).eq("is_suspended", false),
    db.from("profiles").select("id", head).eq("role", "customer"),
    db.from("profiles").select("id", head).eq("role", "barber"),
    db.from("shops").select("*"),
    db.from("bookings").select("*").gte("booking_date", since).order("created_at", { ascending: false }),
  ]);

  const shops = (shopsData as ShopRow[]) ?? [];
  const shopName = new Map(shops.map((s) => [s.id, s.name]));
  const month = (monthData as BookingRow[]) ?? [];
  const todays = month.filter((b) => b.booking_date === today);
  const done = month.filter((b) => b.status === "done");
  const gmv30 = done.reduce((a, b) => a + b.total_amount, 0);
  const gmvToday = todays.filter((b) => b.status === "done").reduce((a, b) => a + b.total_amount, 0);
  const cancelRate = month.length
    ? Math.round((month.filter((b) => b.status === "cancelled" || b.status === "no_show").length / month.length) * 100)
    : 0;
  const appShare = month.length ? Math.round((month.filter((b) => b.customer_id).length / month.length) * 100) : 0;

  const days = Array.from({ length: 14 }, (_, i) => {
    const key = istDate(new Date(Date.now() - (13 - i) * 864e5));
    return { key, n: month.filter((b) => b.booking_date === key).length };
  });
  const maxN = Math.max(1, ...days.map((d) => d.n));

  const top = Array.from(
    done.reduce((m, b) => m.set(b.shop_id, (m.get(b.shop_id) ?? 0) + b.total_amount), new Map<string, number>())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <PageHeader title="Platform overview" subtitle={`Today, ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`} />

      {(pending ?? 0) > 0 && (
        <Link
          href="/admin/shops?status=pending"
          className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 hover:bg-amber-100"
        >
          <ShieldAlert size={18} />
          <span>
            <b>{pending}</b> live shop{pending === 1 ? "" : "s"} waiting for verification. Review them →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live shops" value={liveShops ?? 0} hint={`${allShops ?? 0} registered`} icon={<Store />} href="/admin/shops" />
        <StatCard label="Customers" value={customers ?? 0} hint={`${barbers ?? 0} barbers`} icon={<Users />} href="/admin/users" />
        <StatCard label="Bookings today" value={todays.length} hint={`${month.length} in 30 days`} icon={<CalendarClock />} href="/admin/bookings" />
        <StatCard label="GMV (30 days)" value={formatINR(gmv30)} hint={`${formatINR(gmvToday)} today`} icon={<IndianRupee />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <TrendingUp size={18} className="text-gold-dark" /> Bookings — last 14 days
            </h2>
            <div className="flex gap-4 text-xs text-ink/50">
              <span>App bookings: <b className="text-ink">{appShare}%</b></span>
              <span>Cancel/no-show: <b className="text-ink">{cancelRate}%</b></span>
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {days.map((d) => (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-ink/40">{d.n || ""}</span>
                <div
                  className={`w-full rounded-t ${d.key === today ? "bg-gold" : "bg-ink/80"}`}
                  style={{ height: `${Math.max(3, (d.n / maxN) * 100)}%` }}
                />
                <span className="text-[10px] text-ink/40">{d.key.slice(8)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-ink">Top shops (30 days)</h2>
          {top.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No completed visits yet.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {top.map(([id, amt], i) => (
                <li key={id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-gold">{i + 1}</span>
                  <span className="flex-1 truncate text-ink">{shopName.get(id) ?? "—"}</span>
                  <span className="font-semibold text-ink">{formatINR(amt)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Scissors size={18} className="text-gold-dark" /> Latest bookings
          </h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-gold-dark">View all →</Link>
        </div>
        {month.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink/50">No bookings in the last 30 days.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {month.slice(0, 8).map((b) => {
              const meta = BOOKING_STATUS_LABEL[b.status];
              return (
                <div key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  <span className="flex-1 text-ink">
                    {b.customer_name || "Customer"} <span className="text-ink/40">at</span> {shopName.get(b.shop_id) ?? "—"}
                  </span>
                  <span className="text-ink/50">{new Date(b.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  <span className="w-20 text-right font-semibold text-ink">{formatINR(b.total_amount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
