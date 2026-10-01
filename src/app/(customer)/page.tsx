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
  CalendarCheck,
  Plus,
  ShieldCheck,
  HeartHandshake,
  Share2,
  Sparkles,
  Store,
} from "lucide-react";

const MARQUEE = [
  "✂️ Haircut",
  "🧵 Threading",
  "💅 Mani-pedi",
  "🧖 Facial",
  "🎨 Hair colour",
  "🌸 Waxing",
  "🧔 Beard trim",
  "💆 Hair spa",
  "💄 Party makeup",
  "🧒 Kids cut",
];

/** Category tiles → open discovery pre-filtered. */
const TILES = [
  { cat: "hair", label: "Haircut & styling", emoji: "✂️", tint: "from-amber-100 to-orange-100" },
  { cat: "threading", label: "Threading", emoji: "🧵", tint: "from-pink-100 to-rose-100", forWho: "women" },
  { cat: "skin", label: "Facial & skin", emoji: "🧖", tint: "from-emerald-100 to-teal-100" },
  { cat: "nails", label: "Mani & pedi", emoji: "💅", tint: "from-fuchsia-100 to-pink-100", forWho: "women" },
  { cat: "colour", label: "Hair colour", emoji: "🎨", tint: "from-violet-100 to-indigo-100" },
  { cat: "waxing", label: "Waxing", emoji: "🌸", tint: "from-rose-100 to-orange-100", forWho: "women" },
  { cat: "beard", label: "Beard & shave", emoji: "🧔", tint: "from-sky-100 to-cyan-100", forWho: "men" },
  { cat: "makeup", label: "Makeup & bridal", emoji: "💄", tint: "from-red-100 to-pink-100", forWho: "women" },
];

const AUDIENCE = [
  { for: "women", title: "For her", desc: "Beauty parlours & women's salons — threading, facials, mani-pedi, colour.", emoji: "💅", cls: "from-pink-500 to-rose-500" },
  { for: "men", title: "For him", desc: "Barbershops & men's salons — cuts, fades, beard and shave.", emoji: "💈", cls: "from-sky-500 to-indigo-500" },
  { for: "unisex", title: "Unisex", desc: "Salons that welcome everyone — come together, get ready together.", emoji: "✨", cls: "from-violet-500 to-fuchsia-500" },
];

const FAQ = [
  {
    q: "Is BarberNow free for customers?",
    a: "Yes. Booking is free and you pay the salon directly after your service — cash or UPI.",
  },
  {
    q: "Is it only for men?",
    a: "Not at all. You'll find women's salons, beauty parlours and unisex salons too. Use the Women / Men / Unisex filter, and look for the “Female staff” badge.",
  },
  {
    q: "How does the live queue work?",
    a: "Join the queue from your phone and see exactly how many people are ahead of you. It updates as the salon finishes each customer, so you leave home only when it's almost your turn.",
  },
  {
    q: "What if I'm running late?",
    a: "Cancel from My Bookings anytime before your turn, so your spot goes to the next person.",
  },
  {
    q: "Are the salons verified?",
    a: "Every partner salon is reviewed by our team before it goes live, and only customers who actually visited can leave a review.",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; for?: string; cat?: string }>;
}) {
  const sp = await searchParams;
  const q = String(sp.q ?? "").slice(0, 80);
  const forWho = String(sp.for ?? "all");
  const cat = String(sp.cat ?? "all");
  const shops = await getPublishedShops();
  const openCount = shops.filter((s) => s.openNow).length;
  const cities = Array.from(new Set(shops.map((s) => s.city).filter(Boolean)));
  const featured = featuredShops(shops);

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500/20 via-coral/20 to-gold/25 blur-3xl" />

        <div className="container-app relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-fade-up">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-cream/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {shops.length > 0
                ? `${openCount} salon${openCount === 1 ? "" : "s"} open right now${cities.length ? ` in ${cities.slice(0, 2).join(", ")}` : ""}`
                : "Now onboarding salons across India"}
            </span>

            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl">
              Salon jao,
              <br />
              <span className="text-gradient">line mein nahi.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-cream/65">
              Haircuts, threading, facials, mani-pedi — book at salons near you, watch the live queue, and walk in
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
                placeholder="Try “threading”, “facial” or a salon name…"
                aria-label="Search salons"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40"
              />
              <button className="btn-gold shrink-0 px-5 py-2.5">Search</button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {AUDIENCE.map((a) => (
                <Link
                  key={a.for}
                  href={`/?for=${a.for}#discover`}
                  className="glass rounded-full px-4 py-2 text-sm font-medium text-cream/85 transition hover:bg-white/15"
                >
                  {a.emoji} {a.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative hidden justify-center sm:flex">
            <PhoneMockup />
          </div>
        </div>

        <div className="relative border-t border-white/10 py-4">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-sm font-medium text-cream/50">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CATEGORIES ───────────── */}
      <section className="pt-16">
        <div className="container-app">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">What are you in the mood for?</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TILES.map((t) => (
              <Link
                key={t.cat}
                href={`/?cat=${t.cat}${t.forWho ? `&for=${t.forWho}` : ""}#discover`}
                className={`group flex items-center gap-3 rounded-2xl bg-gradient-to-br ${t.tint} p-4 transition hover:-translate-y-0.5 hover:shadow-card`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-2xl shadow-sm transition group-hover:scale-110">
                  {t.emoji}
                </span>
                <span className="font-semibold text-ink">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FEATURED ───────────── */}
      {featured.length >= 2 && (
        <section className="pt-16">
          <div className="container-app">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Featured</span>
                <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">Salons in the spotlight</h2>
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
      <DiscoverSection
        key={`${q}|${forWho}|${cat}`}
        shops={shops}
        initialQuery={q}
        initialAudience={forWho}
        initialCategory={cat}
      />

      {/* ───────────── FOR HER / HIM / UNISEX ───────────── */}
      <section className="pb-20">
        <div className="container-app grid gap-5 md:grid-cols-3">
          {AUDIENCE.map((a) => (
            <Link
              key={a.for}
              href={`/?for=${a.for}#discover`}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${a.cls} p-7 text-white transition hover:-translate-y-1 hover:shadow-premium`}
            >
              <span className="absolute -right-4 -top-4 text-8xl opacity-20 transition group-hover:scale-110">{a.emoji}</span>
              <p className="relative font-display text-3xl font-bold">{a.title}</p>
              <p className="relative mt-2 max-w-xs text-sm text-white/85">{a.desc}</p>
              <span className="relative mt-6 inline-flex items-center gap-1 text-sm font-semibold">
                Explore <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section id="how" className="scroll-mt-20 pb-20">
        <div className="container-app">
          <SectionHead eyebrow="How it works" title="Three taps. Zero waiting." />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Step n="01" icon={<Search />} title="Find a salon" desc="Salons near you with live wait times, real reviews, photos and prices." />
            <Step n="02" icon={<CalendarCheck />} title="Grab your spot" desc="Join the live queue or pick a time slot. Choose your stylist, even request a song." />
            <Step n="03" icon={<BellRing />} title="Walk in on time" desc="Watch your position drop in real time. Leave home only when you're next." />
          </div>
        </div>
      </section>

      {/* ───────────── SAFE & COMFORTABLE ───────────── */}
      <section className="pb-20">
        <div className="container-app">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-50 via-cream to-amber-50 p-8 sm:p-12">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-pink-200/50 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div>
                <span className="eyebrow">Comfort first</span>
                <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">
                  Feel safe, <span className="text-gradient">every visit.</span>
                </h2>
                <p className="mt-3 text-ink/60">
                  No crowded waiting rooms, no strangers staring while you wait. Book a slot, arrive on time,
                  and choose salons that make you comfortable.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Trust icon={<ShieldCheck />} title="Verified salons" desc="Every partner is checked by our team before going live." />
                <Trust icon={<HeartHandshake />} title="Female staff badge" desc="Find salons with female stylists & beauticians." />
                <Trust icon={<Star />} title="Real reviews only" desc="Only customers who actually visited can rate." />
                <Trust icon={<Share2 />} title="Share your booking" desc="Send your booking details to family in one tap." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── BENTO ───────────── */}
      <section className="pb-20">
        <div className="container-app">
          <SectionHead eyebrow="Why BarberNow" title="Your time is precious. We get it." />
          <div className="mt-12 grid auto-rows-[minmax(180px,auto)] gap-5 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-cream md:col-span-2 md:row-span-2">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
              <Users className="text-gold" />
              <h3 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                A live queue you can <span className="text-gradient">actually trust.</span>
              </h3>
              <p className="mt-3 max-w-md text-cream/60">
                Every time the salon finishes a customer, everyone moves forward instantly. No more “bas 10 minute
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
            <Bento icon={<Smartphone />} title="WhatsApp OTP login" desc="No passwords. Your number is your account." />
            <Bento icon={<Music />} title="Request your song 🎶" desc="Your track, your chair, your vibe." accent />
            <Bento icon={<Sparkles />} title="Offers near you" desc="Filter for salons running discounts today." />
            <Bento icon={<IndianRupee />} title="Pay at the salon" desc="No advance payment. Cash or UPI after your service." />
            <Bento icon={<MapPin />} title="Nearest first" desc="Sorted by distance from where you are right now." />
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="pb-16">
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
      <section className="pb-12">
        <div className="container-app">
          <div className="rounded-[2rem] bg-gradient-to-br from-gold via-[#ff8a3d] to-coral p-10 text-center text-ink sm:p-16">
            <h2 className="font-display text-4xl font-extrabold sm:text-6xl">Next appointment, no queue.</h2>
            <p className="mx-auto mt-3 max-w-md text-ink/70">Find a salon near you and grab your spot in under a minute.</p>
            <Link href="#discover" className="btn-primary mt-8 px-8 py-4 text-base">
              Find a salon near me <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── SLIM PARTNER STRIP ───────────── */}
      <section className="pb-20">
        <div className="container-app">
          <Link
            href="/partner"
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-6 py-5 transition hover:shadow-card"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-gold">
                <Store size={18} />
              </span>
              <span>
                <span className="block font-semibold text-ink">Own a salon or barbershop?</span>
                <span className="block text-sm text-ink/60">Get online bookings with 0% commission — see how it works.</span>
              </span>
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-gold-dark">
              Partner with us <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}

/**
 * Ads included in every partner plan: all live salons take turns in the
 * spotlight (order reshuffles once a day), boosted salons always first.
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

function Trust({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-5 shadow-sm backdrop-blur">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <p className="mt-3 font-semibold text-ink">{title}</p>
      <p className="text-sm text-ink/60">{desc}</p>
    </div>
  );
}

function Bento({ icon, title, desc, accent }: { icon: React.ReactNode; title: string; desc: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-3xl p-6 transition hover:-translate-y-1 hover:shadow-premium ${
        accent ? "bg-gradient-to-br from-gold to-coral text-ink" : "border border-black/5 bg-white text-ink"
      }`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent ? "bg-ink text-gold" : "bg-gold/15 text-gold-dark"}`}>
        {icon}
      </span>
      <h3 className="mt-5 font-display text-xl font-bold">{title}</h3>
      <p className={`mt-1 text-sm ${accent ? "text-ink/70" : "text-ink/60"}`}>{desc}</p>
    </div>
  );
}
