import Link from "next/link";
import { shops } from "@/lib/data";
import { DiscoverSection } from "@/components/DiscoverSection";
import {
  Search,
  CalendarClock,
  BellRing,
  Scissors,
  Clock,
  Star,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
        <div className="container-app relative py-20 sm:py-28">
          <div className="max-w-2xl animate-fade-up">
            <span className="badge bg-gold/20 text-gold-light">
              <Clock size={12} /> No more waiting in line
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-6xl">
              Skip the wait.
              <br />
              <span className="text-gold">Book your barber</span> in seconds.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-cream/70">
              Discover top-rated barbershops near you, check live queue status,
              and reserve your slot online. Made for India. 🇮🇳
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#discover" className="btn-gold">
                <Search size={18} /> Find shops near me
              </Link>
              <Link href="#how" className="btn-outline border-white/20 bg-white/5 text-cream hover:border-white/50">
                How it works
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <Stat value="500+" label="Partner shops" />
              <Stat value="4.8★" label="Avg. rating" />
              <Stat value="12 min" label="Avg. time saved" />
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVER */}
      <DiscoverSection shops={shops} />

      {/* HOW IT WORKS */}
      <section id="how" className="scroll-mt-20 bg-white py-16">
        <div className="container-app">
          <div className="text-center">
            <span className="badge bg-gold/15 text-gold-dark">Simple &amp; fast</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
              How BarberNow works
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              icon={<Search />}
              step="1"
              title="Discover nearby shops"
              desc="Browse barbershops around you with real ratings, photos and live queue status."
            />
            <Step
              icon={<CalendarClock />}
              step="2"
              title="Pick service & slot"
              desc="Choose your services and a time slot — or join the virtual queue from home."
            />
            <Step
              icon={<BellRing />}
              step="3"
              title="Get notified, walk in"
              desc="We alert you when it's almost your turn. Arrive just in time — zero waiting."
            />
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container-app py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon={<Clock />} title="Real-time queues" desc="See exactly how long you'll wait before you leave home." />
          <Feature icon={<Star />} title="Verified ratings" desc="Honest reviews from real customers, not fake stars." />
          <Feature icon={<ShieldCheck />} title="Trusted partners" desc="Every shop is verified and follows hygiene standards." />
          <Feature icon={<Smartphone />} title="Book in seconds" desc="Phone + OTP login. No lengthy forms, no hassle." />
        </div>
      </section>

      {/* BARBER CTA */}
      <section className="container-app pb-16">
        <div className="card relative overflow-hidden bg-ink p-8 text-cream sm:p-12">
          <div className="absolute -right-10 -top-10 opacity-10">
            <Scissors size={180} />
          </div>
          <div className="relative max-w-xl">
            <h2 className="font-display text-3xl font-bold">
              Own a barbershop? <span className="text-gold">Grow with us.</span>
            </h2>
            <p className="mt-3 text-cream/70">
              List your shop, manage your queue, and reach more customers. Add
              your services, photos, prices and offers yourself — it takes
              minutes.
            </p>
            <Link href="#" className="btn-gold mt-6">
              List your shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-bold text-gold">{value}</p>
      <p className="text-sm text-cream/60">{label}</p>
    </div>
  );
}

function Step({
  icon,
  step,
  title,
  desc,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 text-gold-dark">
        {icon}
      </div>
      <span className="mt-4 inline-block font-display text-sm font-bold text-gold-dark">
        STEP {step}
      </span>
      <h3 className="mt-1 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink/60">{desc}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-gold">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink/60">{desc}</p>
    </div>
  );
}
