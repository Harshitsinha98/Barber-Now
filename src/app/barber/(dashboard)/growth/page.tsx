import { requireBarberShop } from "@/lib/barber";
import type { ShopStatsRow } from "@/lib/supabase/database.types";
import { BOOST_PACKS, daysLeft, isActive } from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { PayButton } from "@/components/barber/PayButton";
import { Rocket, Eye, MousePointerClick, CalendarCheck, Check, Megaphone, Flame } from "lucide-react";

const istDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

export default async function GrowthPage() {
  const { supabase, shop } = await requireBarberShop();
  const since = istDay(new Date(Date.now() - 29 * 864e5));
  const { data } = await supabase
    .from("shop_stats_daily")
    .select("*")
    .eq("shop_id", shop.id)
    .gte("day", since);
  const stats = (data as ShopStatsRow[]) ?? [];

  const sum = (k: keyof Pick<ShopStatsRow, "impressions" | "clicks" | "bookings">) =>
    stats.reduce((a, s) => a + s[k], 0);
  const impressions = sum("impressions");
  const clicks = sum("clicks");
  const bookings = sum("bookings");
  const ctr = impressions ? ((clicks / impressions) * 100).toFixed(1) : "0.0";

  const days = Array.from({ length: 14 }, (_, i) => {
    const key = istDay(new Date(Date.now() - (13 - i) * 864e5));
    const s = stats.find((x) => x.day === key);
    return { key, v: s?.impressions ?? 0, c: s?.clicks ?? 0 };
  });
  const max = Math.max(1, ...days.map((d) => d.v));

  const boosted = isActive(shop.boost_until);
  const subActive = isActive(shop.subscription_until);

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Boost &amp; ads</h1>
        <p className="text-sm text-ink/60">See how customers find you, and get to the top when you need a rush.</p>
      </div>

      {/* Status */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 ${
          boosted ? "bg-gradient-to-br from-gold via-[#ff8a3d] to-coral text-ink" : "bg-ink text-cream"
        }`}
      >
        {!boosted && <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-coral/30 blur-3xl" />}
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${boosted ? "bg-ink text-gold" : "bg-white/10 text-gold"}`}>
              {boosted ? <Flame /> : <Megaphone />}
            </span>
            <div>
              <p className="font-display text-2xl font-bold">
                {boosted ? `Boost live · ${daysLeft(shop.boost_until)} days left` : "Standard listing (ads included)"}
              </p>
              <p className={`text-sm ${boosted ? "text-ink/70" : "text-cream/60"}`}>
                {boosted
                  ? "You're pinned to the top of nearby results with a “Sponsored” spotlight."
                  : "Your ₹1,499 plan already shows you in the app & featured rotations. Boost to jump to the top."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={<Eye />} label="Impressions (30d)" value={impressions.toLocaleString("en-IN")} hint="Times your card was shown" />
        <Metric icon={<MousePointerClick />} label="Profile visits" value={clicks.toLocaleString("en-IN")} hint={`${ctr}% click rate`} />
        <Metric icon={<CalendarCheck />} label="App bookings" value={bookings.toLocaleString("en-IN")} hint="From BarberNow customers" />
        <Metric
          icon={<Rocket />}
          label="Visit → booking"
          value={clicks ? `${Math.round((bookings / clicks) * 100)}%` : "—"}
          hint="Conversion"
        />
      </div>

      <div className="card p-5">
        <p className="font-display text-lg font-bold text-ink">Last 14 days</p>
        <div className="mt-5 flex h-36 items-end gap-1.5">
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1" title={`${d.v} impressions · ${d.c} visits`}>
              <div className="relative w-full rounded-t-md bg-ink/80" style={{ height: `${Math.max(3, (d.v / max) * 100)}%` }}>
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-coral to-gold"
                  style={{ height: `${d.v ? (d.c / d.v) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-ink/40">{d.key.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex gap-4 text-xs text-ink/50">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-ink/80" /> Impressions</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gold" /> Visits share</span>
        </p>
      </div>

      {/* Packs */}
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Boost packs</h2>
        <p className="text-sm text-ink/60">
          One-time payment, no auto-renew. Buying again adds days on top.
          {!subActive && " Activate your partner plan first."}
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {BOOST_PACKS.map((b) => (
            <div
              key={b.code}
              className={`relative flex flex-col rounded-3xl p-6 ${
                b.popular ? "bg-ink text-cream shadow-glow" : "border border-black/5 bg-white text-ink"
              }`}
            >
              {b.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-gold to-coral px-3 py-1 text-[11px] font-bold uppercase text-ink">
                  Most popular
                </span>
              )}
              <p className="font-display text-2xl font-bold">{b.name}</p>
              <p className={`text-sm ${b.popular ? "text-cream/60" : "text-ink/50"}`}>{b.tagline}</p>
              <p className="mt-4">
                <span className="font-display text-4xl font-extrabold">{formatINR(b.price)}</span>
                <span className={b.popular ? "text-cream/60" : "text-ink/50"}> / {b.days} days</span>
              </p>
              <p className={`text-xs ${b.popular ? "text-cream/50" : "text-ink/40"}`}>≈ {formatINR(Math.round(b.price / b.days))} per day</p>
              <ul className="my-5 space-y-2 text-sm">
                {b.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-gold" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <PayButton
                  planCode={b.code}
                  label={boosted ? `Add ${b.days} days` : `Boost for ${b.days} days`}
                  className={b.popular ? "btn-gold w-full" : "btn-primary w-full"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink/40">
        Boosted shops are always labelled “Sponsored” for customers. Ranking still respects distance — a boost can&apos;t
        show you to customers outside their search radius.
      </p>
    </div>
  );
}

function Metric({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="card p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs font-medium text-ink/70">{label}</p>
      <p className="text-[11px] text-ink/40">{hint}</p>
    </div>
  );
}
