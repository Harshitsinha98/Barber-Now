import Link from "next/link";
import type { Metadata } from "next";
import { PARTNER_PLAN, BOOST_PACKS } from "@/lib/plans";
import { formatINR } from "@/lib/utils";
import { SALON_TYPES } from "@/lib/salon";
import { CommissionCalculator } from "@/components/landing/CommissionCalculator";
import {
  ArrowRight,
  Check,
  Smartphone,
  Store,
  Scissors,
  ImageIcon,
  FileText,
  CreditCard,
  ShieldCheck,
  Rocket,
  Plus,
  Clock4,
  Users,
  Star,
  TrendingUp,
  Megaphone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Partner with BarberNow — for barbershops, women's & unisex salons",
  description:
    "Get online bookings and a crowd-free live queue for your salon. ₹1,499/month, 0% commission. See how onboarding works.",
};

const PROCESS = [
  { icon: Smartphone, title: "Sign in with your mobile", time: "1 min", desc: "Enter your number, verify the WhatsApp OTP. No passwords, no paperwork to print." },
  { icon: Store, title: "Tell us about your salon", time: "2 min", desc: "Salon type (men's, women's or unisex), name, address, pin on map, timings and weekly off." },
  { icon: Scissors, title: "Add services & prices", time: "3 min", desc: "Pick from ready-made templates — haircut, threading, facial, mani-pedi, colour — and set your own prices and offers." },
  { icon: ImageIcon, title: "Upload photos", time: "2 min", desc: "A cover photo (required) and a few gallery shots of your work and interiors." },
  { icon: FileText, title: "Verify your business", time: "1 min", desc: "PAN of the owner or business. GSTIN and a shop licence are optional but speed up approval." },
  { icon: CreditCard, title: "Activate your plan", time: "1 min", desc: `Pay ${formatINR(PARTNER_PLAN.price)} for 30 days securely via Razorpay — UPI, cards, net banking or wallets. Pay now or after approval.` },
  { icon: ShieldCheck, title: "We review your salon", time: "within 24 hrs", desc: "Our team checks your details and photos. If something's missing, we tell you exactly what to fix." },
  { icon: Rocket, title: "You're live 🎉", time: "instantly", desc: "Customers nearby can find you, see your live queue and book. Manage everything from your phone." },
];

const DOCS = [
  { need: "Required", items: ["Mobile number (for OTP login)", "Owner / business PAN", "At least 1 cover photo", "At least 1 service with price"] },
  { need: "Optional (faster approval)", items: ["GSTIN", "Shop registration / trade licence / Udyam", "Gallery photos (4+ recommended)", "Team members' names"] },
];

const FAQ = [
  { q: "Is there any commission on bookings?", a: "No. You pay a flat ₹1,499 per 30 days. Customers pay you directly at the salon — cash or UPI — and you keep 100% of it." },
  { q: "Can women's salons and beauty parlours join?", a: "Yes. BarberNow is for men's salons, women's salons / beauty parlours and unisex salons. Choose your salon type during onboarding and we'll suggest the right service menu." },
  { q: "How do I pay the ₹1,499?", a: "Inside the partner app via Razorpay — UPI, debit/credit card, net banking or wallets. You get a receipt for every payment." },
  { q: "Does the plan auto-renew?", a: "No. Each payment gives you 30 days. We remind you 5 days before it ends. Renewing early adds 30 days on top, so you never lose days." },
  { q: "What happens if I don't renew?", a: "Your salon is hidden from customers until you renew. Your services, photos, reviews and history stay safe." },
  { q: "What if my application is rejected?", a: "We'll tell you the exact reason (for example, unclear photo or PAN mismatch). Fix it and resubmit — no extra charge." },
  { q: "What are boosts?", a: "Optional paid packs that put your salon at the top of nearby results with a 'Sponsored' tag — great for festival seasons or a slow week." },
];

export default function PartnerPage() {
  const p = PARTNER_PLAN;
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-gold/25 via-coral/20 to-fuchsia-500/15 blur-3xl" />
        <div className="container-app relative py-20 text-center sm:py-28">
          <span className="glass inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
            For salons &amp; barbershops
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-extrabold leading-[0.95] sm:text-7xl">
            More customers. <span className="text-gradient">Zero commission.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-cream/65">
            Online bookings, a crowd-free live queue and in-app promotion for men&apos;s, women&apos;s and unisex
            salons — for one flat {formatINR(p.price)} a month.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/barber/login" className="btn-gold px-8 py-4 text-base">
              Start onboarding <ArrowRight size={18} />
            </Link>
            <Link href="#process" className="btn-outline border-white/20 bg-white/5 px-8 py-4 text-base text-cream hover:bg-white/10">
              See how it works
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4">
            {[
              { k: "0%", v: "commission" },
              { k: formatINR(p.price), v: "per 30 days" },
              { k: "~10 min", v: "to apply" },
            ].map((x) => (
              <div key={x.v} className="glass rounded-2xl p-4">
                <p className="font-display text-2xl font-bold sm:text-3xl">{x.k}</p>
                <p className="text-xs text-cream/50">{x.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO CAN JOIN */}
      <section className="py-20">
        <div className="container-app">
          <Head eyebrow="Who can join" title="Built for every kind of salon" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SALON_TYPES.map((t) => (
              <div key={t.value} className="rounded-3xl border border-black/5 bg-white p-7 transition hover:-translate-y-1 hover:shadow-premium">
                <span className="text-4xl">{t.emoji}</span>
                <h3 className="mt-4 font-display text-2xl font-bold text-ink">{t.label}</h3>
                <p className="mt-1 text-ink/60">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="pb-20">
        <div className="container-app">
          <Head eyebrow="What you get" title="Everything to run a fully booked salon" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, t: "Live queue", d: "Customers wait at home, not in your shop. Add walk-ins in one tap." },
              { icon: Megaphone, t: "Ads included", d: "Show up in nearby search and the daily Partner Spotlight on the home page." },
              { icon: Star, t: "Reviews", d: "Only real, completed visits can review you — build trust that sells." },
              { icon: TrendingUp, t: "Earnings dashboard", d: "Today's customers, earnings, 7-day trend, and an ads report." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-3xl border border-black/5 bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-gold">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">{t}</h3>
                <p className="mt-1 text-sm text-ink/60">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="scroll-mt-20 bg-white py-20">
        <div className="container-app max-w-4xl">
          <Head eyebrow="Onboarding process" title="From sign-up to live in 8 steps" />
          <p className="mx-auto mt-3 max-w-xl text-center text-ink/60">
            You fill everything from your phone in about 10 minutes. We verify within 24 hours.
          </p>
          <ol className="relative mt-12 space-y-4 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-gradient-to-b before:from-gold before:to-coral">
            {PROCESS.map(({ icon: Icon, title, time, desc }, i) => (
              <li key={title} className="relative flex gap-5">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-gold shadow-glow">
                  <Icon size={22} />
                </span>
                <div className="flex-1 rounded-2xl border border-black/5 bg-cream p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-lg font-bold text-ink">
                      <span className="mr-2 text-gold-dark">{String(i + 1).padStart(2, "0")}</span>
                      {title}
                    </p>
                    <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-ink/60">
                      <Clock4 size={12} /> {time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">{desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {DOCS.map((d) => (
              <div key={d.need} className="rounded-3xl border border-black/5 bg-cream p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">{d.need}</p>
                <ul className="mt-3 space-y-2 text-sm text-ink/80">
                  {d.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="py-20">
        <div className="container-app max-w-5xl">
          <Head eyebrow="Do the math" title="Flat fee beats commission" />
          <div className="mt-10">
            <CommissionCalculator />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-20 pb-20">
        <div className="container-app">
          <Head eyebrow="Pricing" title="One plan. Optional boosts." />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-cream sm:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/25 blur-3xl" />
              <div className="relative">
                <span className="glass rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">{p.name}</span>
                <p className="mt-5">
                  <span className="font-display text-6xl font-extrabold">{formatINR(p.price)}</span>
                  <span className="text-cream/60"> / 30 days</span>
                </p>
                <p className="mt-1 text-sm text-cream/60">GST-inclusive · no setup fee · no auto-debit</p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-gold" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/barber/login" className="btn-gold mt-8">
                  Start onboarding <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                <Rocket size={20} className="text-coral" /> Boosts — when you want a rush
              </p>
              {BOOST_PACKS.map((b) => (
                <div key={b.code} className={`flex items-center justify-between rounded-2xl p-5 ${b.popular ? "bg-gradient-to-r from-gold to-coral text-ink" : "border border-black/5 bg-white"}`}>
                  <div>
                    <p className="font-display text-lg font-bold">{b.name}</p>
                    <p className={`text-xs ${b.popular ? "text-ink/70" : "text-ink/50"}`}>{b.tagline}</p>
                  </div>
                  <p className="text-right">
                    <span className="font-display text-2xl font-extrabold">{formatINR(b.price)}</span>
                    <span className="block text-xs">{b.days} days</span>
                  </p>
                </div>
              ))}
              <p className="text-xs text-ink/50">
                Boosted salons appear at the top of nearby results (within the customer&apos;s radius) with a
                “Sponsored” label, and first in the Partner Spotlight.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20">
        <div className="container-app max-w-3xl">
          <Head eyebrow="FAQ" title="Partner questions" />
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

      {/* CTA */}
      <section className="pb-24">
        <div className="container-app">
          <div className="rounded-[2rem] bg-gradient-to-br from-gold via-[#ff8a3d] to-coral p-10 text-center text-ink sm:p-16">
            <h2 className="font-display text-4xl font-extrabold sm:text-6xl">Ready to fill your chairs?</h2>
            <p className="mx-auto mt-3 max-w-md text-ink/70">Apply in about 10 minutes from your phone.</p>
            <Link href="/barber/login" className="btn-primary mt-8 px-8 py-4 text-base">
              Start onboarding <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold text-ink sm:text-5xl">{title}</h2>
    </div>
  );
}
