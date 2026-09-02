import Link from "next/link";
import { Scissors, Instagram, Twitter, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-cream/80">
      <div className="container-app grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-ink">
              <Scissors size={18} />
            </span>
            <span className="font-display text-xl font-bold text-cream">
              Barber<span className="text-gold">Now</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
            Skip the wait. Discover top barbershops near you, check live queues,
            and book your slot in seconds. Made for India. 🇮🇳
          </p>
          <div className="mt-5 flex gap-3">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-cream/70 transition-colors hover:bg-gold hover:text-ink"
              >
                <Icon size={16} />
              </span>
            ))}
          </div>
        </div>

        <FooterCol
          title="Customers"
          links={[
            { label: "Discover shops", href: "/#discover" },
            { label: "How it works", href: "/#how" },
            { label: "My bookings", href: "/bookings" },
          ]}
        />
        <FooterCol
          title="Barbers"
          links={[
            { label: "List your shop", href: "#" },
            { label: "Partner app", href: "#" },
            { label: "Pricing", href: "#" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "About us", href: "#" },
            { label: "Contact", href: "#" },
            { label: "Privacy", href: "#" },
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="container-app flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} BarberNow. All rights reserved.</p>
          <p>Built with ✂️ for Indian barbers &amp; customers.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wider text-cream">
        {title}
      </h4>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-sm text-cream/60 transition-colors hover:text-gold"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
