import Link from "next/link";
import { getPublishedShops } from "@/lib/shops";
import { DiscoverSection } from "@/components/DiscoverSection";
import { PhoneMockup } from "@/components/landing/PhoneMockup";
import { ShopCard } from "@/components/ShopCard";
import type { Shop } from "@/lib/types";
import {
  Search,
  BellRing,
  MapPin,
  Smartphone,
  Music,
  IndianRupee,
  Star,
  ArrowRight,
  Users,
  TrendingUp,
  CalendarCheck,
  Plus,
  Zap,
} from "lucide-react";

const MARQUEE = [
  "✂️ Haircut",
  "🧔 Beard trim",
  "🪒 Hot towel shave",
  "💆 Head massage",
  "✨ De-tan facial",
  "🧒 Kids cut",
  "🎨 Hair colour",
  "⭐ Combos",
];

const FAQ = [
  {
    q: "Is BarberNow free for customers?",
    a: "Yes. Booking is free and you pay the shop directly after your service — cash or UPI.",
  },
  {
    q: "How does the live queue work?",
    a: "Join the queue from your phone and see exactly how many people are ahead of you. The count updates as the barber finishes each customer, so you leave home only when it's almost your turn.",
  },
  {
    q: "What if I'm running late?",
    a: "You can cancel from My Bookings anytime before your turn, so your spot goes to the next person.",
  },
  {
    q: "I own a barbershop. What does it cost?",
    a: "Listing is free. Sign in with your mobile number, add your services and photos, and start taking online bookings in about 5 minutes.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = String((await searchParams).q ?? "").slice(0, 80);
  const shops = await getPublishedShops();
  const openCount = shops.filter((s) => s.openNow).length;
  const cities = Array.from(new Set(shops.map((s) => s.city).filter(Boolean)));
  const featured = featuredShops(shops);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-gold/25 via-coral/20 to-fuchsia-500/10 blur-3xl" />

        <div className="container-app relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-fade-up">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-cream/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {shops.length > 0
                ? `${openCount} shop${openCount === 1 ? "" : "s"} open right now${cities.length ? ` in ${cities.slice(0, 2).join(", ")}` : ""}`
                : "Now onboarding barbershops across India"}
            </span>

            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl">
              Haircut,
              <br />
              <span className="text-gradient">bina line ke.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-cream/65">
              See the live queue at barbershops near you, book your spot from the sofa, and walk in
              exactly when it&apos;s your turn.
            </p>

            <form
              action="/#discover"
              className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-glow"
            >
              <Search size={18} className="shrink-0 text-ink/40" />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Shop name, area or service…"
                aria-label="Search barbershops"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
              />
              <button className="btn-gold shrink-0 px-5 py-2.5">Search</button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cream/60">
              <Link href="#discover" className="flex items-center gap-1.5 font-medium text-gold hover:text-gold-light">
                <MapPin size={15} /> Shops near me
              </Link>
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-gold" /> Login with OTP
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee size={14} className="text-gold" /> Pay at shop
              </span>
            </div>
          </div>

          <div className="relative hidden justify-center sm:flex">
            <PhoneMockup />
          </div>
        </div>

        {/* marquee */}
        <div className="relative border-t border-white/10 py-4">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-sm font-medium text-cream/50">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FEATURED (ads included in every partner plan) ───────────── */}
      {featured.length >= 2 && (
        <section className="pt-16">
          <div className="container-app">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Featured</span>
                <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">Partner spotlight</h2>
              </div>
              <Link href="#discover" className="text-sm font-semibold text-gold-dark">
                See all →
              </Link>
            </div>
          </div>
          <div className="no-scrollbar mt-6 flex snap-x gap-5 overflow-x-auto px-5 pb-2 sm:px-8 xl:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
            {featured.map((s) => (
              <div key={s.id} className="w-[300px] shrink-0 snap-start">
                <ShopCard shop={s} sponsored={s.isBoosted} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────── DISCOVER ───────────── */}
      <DiscoverSection key={q} shops={shops} initialQuery={q} />

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section id="how" className="scroll-mt-20 py-20">
        <div className="container-app">
          <SectionHead eyebrow="How it works" title="Three taps. Zero waiting." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Step
              n="01"
              icon={<Search />}
              title="Find a shop"
              desc="Nearby barbershops with live wait times, real reviews, photos and prices."
            />
            <Step
              n="02"
              icon={<CalendarCheck />}
              title="Grab your spot"
              desc="Join the live queue or pick a time slot. Choose your barber, even request a song."
            />
            <Step
              n="03"
              icon={<BellRing />}
              title="Walk in on time"
              desc="Watch your position drop in real time. Leave home only when you're next."
            />
          </div>
        </div>
      </section>

      {/* ───────────── BENTO FEATURES ───────────── */}
      <section className="pb-20">
        <div className="container-app">
          <SectionHead eyebrow="Why BarberNow" title="Built for the way India gets a haircut." />
          <div className="mt-12 grid auto-rows-[minmax(180px,auto)] gap-5 md:grid-cols-3">
            {/* big */}
            <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-cream md:col-span-2 md:row-span-2">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
              <Users className="text-gold" />
              <h3 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                A live queue you can <span className="text-gradient">actually trust.</span>
              </h3>
              <p className="mt-3 max-w-md text-cream/60">
                Every Done tap by the barber moves everyone forward instantly. No more “bas 10 minute
                aur” that turns into an hour.
              </p>
              <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                {[
                  { k: "In chair", v: "1", c: "bg-emerald-500" },
                  { k: "Waiting", v: "3", c: "bg-gold" },
                  { k: "Your wait", v: "~45m", c: "bg-coral" },
                ].map((x) => (
                  <div key={x.k} className="glass rounded-2xl p-3">
                    <span className={`block h-1.5 w-6 rounded-full ${x.c}`} />
                    <p className="mt-3 font-display text-2xl font-bold">{x.v}</p>
                    <p className="text-[11px] uppercase tracking-wide text-cream/50">{x.k}</p>
                  </div>
                ))}
              </div>
            </div>

            <Bento
              icon={<Smartphone />}
              title="WhatsApp OTP login"
              desc="No passwords. Your number is your account."
            />
            <Bento
              icon={<Music />}
              title="Request your song 🎶"
              desc="Your track, your chair, your vibe."
              accent
            />
            <Bento icon={<Star />} title="Real reviews only" desc="Only customers who actually visited can rate a shop." />
            <Bento icon={<IndianRupee />} title="Pay at the shop" desc="No advance payment. Cash or UPI after your cut." />
            <Bento icon={<MapPin />} title="Near you, first" desc="Sorted by distance from where you are right now." />
          </div>
        </div>
      </section>

      {/* ───────────── FOR BARBERS ───────────── */}
      <section className="pb-20">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-cream sm:p-14">
            <div className="bg-grid absolute inset-0" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-coral/25 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <div>
                <span className="glass inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                  For barbershops
                </span>
                <h2 className="mt-5 font-display text-4xl font-bold sm:text-5xl">
                  Your shop, <span className="text-gradient">fully booked.</span>
                </h2>
                <p className="mt-4 max-w-md text-cream/60">
                  Get online bookings, run a crowd-free queue and grow with reviews — all from your
                  phone. Set up in 5 minutes. Free to list.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-cream/80">
                  {[
                    "Live queue + walk-in manager",
                    "Your services, prices & offers — edit anytime",
                    "Daily earnings & weekly trends",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-gold">✓</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <Link href="/barber/login" className="btn-gold mt-8">
                  List your shop — free <ArrowRight size={16} />
                </Link>
              </div>

              {/* mini dashboard preview */}
              <div className="glass rounded-3xl p-5" aria-hidden>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Today</p>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">● Open</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { k: "Served", v: "18" },
                    { k: "In queue", v: "4" },
                    { k: "Earned", v: "₹4,860" },
                  ].map((x) => (
                    <div key={x.k} className="rounded-2xl bg-white/5 p-3">
                      <p className="font-display text-xl font-bold">{x.v}</p>
                      <p className="text-[11px] text-cream/50">{x.k}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex h-28 items-end gap-2">
                  {[40, 62, 48, 75, 58, 88, 100].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-lg ${i === 6 ? "bg-gradient-to-t from-coral to-gold" : "bg-white/15"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-cream/50">
                  <TrendingUp size={13} className="text-gold" /> Sample preview of the partner dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="pb-20">
        <div className="container-app max-w-3xl">
          <SectionHead eyebrow="FAQ" title="Questions? Answered." />
          <div className="mt-10 divide-y divide-black/5 rounded-3xl border border-black/5 bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-ink">
                  {f.q}
                  <Plus size={18} className="shrink-0 text-ink/40 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FINAL CTA ───────────── */}
      <section className="pb-24">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gold via-[#ff8a3d] to-coral p-10 text-center text-ink sm:p-16">
            <h2 className="font-display text-4xl font-extrabold sm:text-6xl">Next cut, no queue.</h2>
            <p className="mx-auto mt-3 max-w-md text-ink/70">
              Find a barbershop near you and grab your spot in under a minute.
            </p>
            <Link href="#discover" className="btn-primary mt-8 px-8 py-4 text-base">
              Find a shop near me <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Ads included in every partner plan: all live shops take turns in the
 * spotlight (order reshuffles once a day), boosted shops always first.
 */
function featuredShops(shops: Shop[]): Shop[] {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const score = (id: string) => {
    let h = 2166136261;
    for (const ch of id + day) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  };
  const rotated = [...shops].sort((a, b) => score(a.id) - score(b.id));
  return [...rotated.filter((s) => s.isBoosted), ...rotated.filter((s) => !s.isBoosted)].slice(0, 8);
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-5xl">{title}</h2>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-7 transition hover:-translate-y-1 hover:shadow-premium">
      <span className="absolute right-6 top-4 font-display text-6xl font-extrabold text-ink/[0.05] transition group-hover:text-gold/20">
        {n}
      </span>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-gold">{icon}</span>
      <h3 className="mt-6 font-display text-2xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-ink/60">{desc}</p>
    </div>
  );
}

function Bento({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-premium ${
        accent
          ? "bg-gradient-to-br from-gold to-coral text-ink"
          : "border border-black/5 bg-white text-ink"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          accent ? "bg-ink text-gold" : "bg-gold/15 text-gold-dark"
        }`}
      >
        {icon}
      </span>
      <h3 className="mt-5 font-display text-xl font-bold">{title}</h3>
      <p className={`mt-1 text-sm ${accent ? "text-ink/70" : "text-ink/60"}`}>{desc}</p>
    </div>
  );
}
