import Link from "next/link";
import { Logo } from "./Navbar";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink pb-24 text-cream/70 md:pb-0">
      <div className="container-app grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/50">
            Salon jao, line mein nahi. Live queues and instant booking at men&apos;s, women&apos;s and unisex salons across India. 🇮🇳
          </p>
        </div>

        <FooterCol
          title="Customers"
          links={[
            { label: "Discover shops", href: "/#discover" },
            { label: "How it works", href: "/#how" },
            { label: "My bookings", href: "/bookings" },
            { label: "My account", href: "/account" },
          ]}
        />
        <FooterCol
          title="For salons"
          links={[
            { label: "Partner with us", href: "/partner" },
            { label: "How onboarding works", href: "/partner#process" },
            { label: "Pricing — ₹1,499/month", href: "/partner#pricing" },
            { label: "Partner login", href: "/barber/login" },
          ]}
        />
        <FooterCol
          title="Help"
          links={[
            { label: "Sign in", href: "/login" },
            { label: "support@barbernow.in", href: "mailto:support@barbernow.in" },
          ]}
        />
      </div>

      <p
        aria-hidden
        className="pointer-events-none select-none text-center font-display text-[22vw] font-extrabold leading-[0.75] tracking-tighter text-white/[0.03]"
      >
        barbernow
      </p>

      <div className="border-t border-white/10">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} BarberNow. All rights reserved.</p>
          <p>Made with ✂️ in India.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-cream">{title}</h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-cream/50 transition-colors hover:text-gold">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
