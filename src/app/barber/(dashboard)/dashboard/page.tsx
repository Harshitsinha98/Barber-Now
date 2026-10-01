import Link from "next/link";
import { requireBarberShop } from "@/lib/barber";
import type { BookingRow } from "@/lib/supabase/database.types";
import { Toggle } from "@/components/barber/Toggle";
import { setPublished, setOpenNow } from "../actions";
import { formatINR } from "@/lib/utils";
import {
  Users,
  MapPin,
  CheckCircle2,
  Circle,
  ArrowRight,
  IndianRupee,
  Scissors,
  Star,
  TrendingUp,
} from "lucide-react";

function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export default async function DashboardPage() {
  const { supabase, shop } = await requireBarberShop();
  const today = istToday();
  const weekAgo = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);

  const [{ count: serviceCount }, { count: teamCount }, { data: weekData }, { data: reviews }] =
    await Promise.all([
      supabase.from("services").select("id", { count: "exact", head: true }).eq("shop_id", shop.id).eq("is_active", true),
      supabase.from("barbers").select("id", { count: "exact", head: true }).eq("shop_id", shop.id),
      supabase.from("bookings").select("*").eq("shop_id", shop.id).gte("booking_date", weekAgo),
      supabase.from("reviews").select("rating").eq("shop_id", shop.id),
    ]);

  const week = (weekData as BookingRow[]) ?? [];
  const todays = week.filter((b) => b.booking_date === today);
  const doneToday = todays.filter((b) => b.status === "done");
  const revenueToday = doneToday.reduce((a, b) => a + b.total_amount, 0);
  const revenueWeek = week.filter((b) => b.status === "done").reduce((a, b) => a + b.total_amount, 0);
  const activeNow = todays.filter((b) => ["booked", "in_queue", "in_service"].includes(b.status));
  const ratings = (reviews as { rating: number }[]) ?? [];
  const avgRating = ratings.length
    ? (ratings.reduce((a, r) => a + r.rating, 0) / ratings.length).toFixed(1)
    : "—";

  // Last 7 days revenue for the mini chart.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 864e5);
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
    const total = week.filter((b) => b.booking_date === key && b.status === "done").reduce((a, b) => a + b.total_amount, 0);
    return { key, label: d.toLocaleDateString("en-IN", { weekday: "short" }), total };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.total));

  const checklist = [
    { done: true, label: "Create your shop", href: "/barber/settings" },
    { done: (serviceCount ?? 0) > 0, label: "Add services & prices", href: "/barber/services" },
    { done: Boolean(shop.cover_image), label: "Upload a cover photo", href: "/barber/photos" },
    { done: Boolean(shop.lat && shop.lng), label: "Set shop location", href: "/barber/settings" },
    { done: (teamCount ?? 0) > 0, label: "Add your team (optional)", href: "/barber/team" },
    { done: shop.is_published, label: "Publish your shop", href: "#visibility" },
  ];
  const remaining = checklist.filter((c) => !c.done).length;

  return (
    <div className="p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink/50">Welcome back 👋</p>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{shop.name}</h1>
          <p className="flex items-center gap-1 text-sm text-ink/60">
            <MapPin size={14} className="text-gold-dark" />
            {[shop.area, shop.city].filter(Boolean).join(", ")}
          </p>
        </div>
        <Link href="/barber/queue" className="btn-gold text-sm">
          <Users size={16} /> Open live queue
          {activeNow.length > 0 && (
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-gold">{activeNow.length}</span>
          )}
        </Link>
      </div>

      {/* Today */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Users />} label="In queue now" value={String(activeNow.length)} />
        <Stat icon={<Scissors />} label="Served today" value={String(doneToday.length)} />
        <Stat icon={<IndianRupee />} label="Earned today" value={formatINR(revenueToday)} />
        <Stat icon={<Star />} label={`Rating (${ratings.length})`} value={avgRating} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Visibility */}
          <div id="visibility" className="card p-5">
            <h2 className="font-display text-lg font-bold text-ink">Shop status</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-black/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Visible to customers</p>
                  <p className="text-xs text-ink/50">
                    {shop.is_published ? "Live on BarberNow." : "Draft — hidden."}
                  </p>
                </div>
                <Toggle checked={shop.is_published} labelOn="Published" labelOff="Draft" onToggle={setPublished} />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-black/5 p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Taking walk-ins</p>
                  <p className="text-xs text-ink/50">
                    {shop.open_now ? "Customers can join the queue." : "Queue closed, slots only."}
                  </p>
                </div>
                <Toggle checked={shop.open_now} labelOn="Open" labelOff="Closed" onToggle={setOpenNow} />
              </div>
            </div>
          </div>

          {/* Week chart */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <TrendingUp size={18} className="text-gold-dark" /> Last 7 days
              </h2>
              <span className="text-sm font-semibold text-ink">{formatINR(revenueWeek)}</span>
            </div>
            <div className="mt-6 flex h-40 items-end gap-2">
              {days.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-ink/40">{d.total ? `₹${d.total}` : ""}</span>
                  <div
                    className={`w-full rounded-t-lg ${d.key === today ? "bg-gold" : "bg-ink/80"}`}
                    style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }}
                  />
                  <span className="text-xs text-ink/50">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="card h-fit p-5">
          <h2 className="font-display text-lg font-bold text-ink">
            {remaining === 0 ? "You're all set ✅" : "Setup checklist"}
          </h2>
          <p className="text-xs text-ink/50">
            {remaining === 0 ? "Your shop is fully set up." : `${remaining} step${remaining > 1 ? "s" : ""} left to get more bookings`}
          </p>
          <ul className="mt-4 space-y-1">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-black/5"
                >
                  {c.done ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <Circle size={18} className="text-ink/25" />
                  )}
                  <span className={c.done ? "text-ink/50 line-through" : "font-medium text-ink"}>
                    {c.label}
                  </span>
                  {!c.done && <ArrowRight size={14} className="ml-auto text-ink/30" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-gold [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink/50">{label}</p>
    </div>
  );
}
