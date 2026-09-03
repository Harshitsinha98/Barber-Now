"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scissors,
  ImageIcon,
  Users,
  LogOut,
  Store,
} from "lucide-react";
import { logout } from "@/app/barber/actions";

const items = [
  { href: "/barber/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/barber/services", label: "Services & Prices", icon: Scissors },
  { href: "/barber/photos", label: "Photos", icon: ImageIcon },
  { href: "/barber/queue", label: "Queue & Bookings", icon: Users },
];

export function BarberNav({ shopName }: { shopName?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 border-b border-white/10 bg-ink p-4 text-cream md:h-screen md:w-64 md:border-b-0 md:border-r">
      <Link href="/barber/dashboard" className="mb-4 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-ink">
          <Store size={18} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-bold">
            Barber<span className="text-gold">Now</span>
          </p>
          <p className="truncate text-xs text-cream/50">
            {shopName || "Partner Portal"}
          </p>
        </div>
      </Link>

      <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gold text-ink"
                  : "text-cream/70 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className="mt-auto hidden md:block">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5 hover:text-cream">
          <LogOut size={18} /> Logout
        </button>
      </form>
    </aside>
  );
}
