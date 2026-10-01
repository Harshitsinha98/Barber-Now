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
  UserCog,
  Star,
  Settings,
  ExternalLink,
} from "lucide-react";
import { logout } from "@/app/barber/actions";

const items = [
  { href: "/barber/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/barber/queue", label: "Live queue", icon: Users },
  { href: "/barber/services", label: "Services & prices", icon: Scissors },
  { href: "/barber/team", label: "Team", icon: UserCog },
  { href: "/barber/photos", label: "Photos", icon: ImageIcon },
  { href: "/barber/reviews", label: "Reviews", icon: Star },
  { href: "/barber/settings", label: "Shop settings", icon: Settings },
];

export function BarberNav({
  shopName,
  shopSlug,
  isLive,
  queueCount,
}: {
  shopName?: string | null;
  shopSlug?: string | null;
  isLive?: boolean;
  queueCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-40 flex w-full shrink-0 flex-col gap-1 border-b border-white/10 bg-ink p-3 text-cream md:h-screen md:w-64 md:border-b-0 md:border-r md:p-4">
      <div className="mb-2 flex items-center justify-between gap-2 px-2 md:mb-4">
        <Link href="/barber/dashboard" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-ink">
            <Store size={18} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="font-display text-lg font-bold">
              Barber<span className="text-gold">Now</span>
            </p>
            <p className="truncate text-xs text-cream/50">{shopName || "Partner Portal"}</p>
          </div>
        </Link>
        <form action={logout} className="md:hidden">
          <button className="rounded-lg p-2 text-cream/60 hover:bg-white/5" title="Logout">
            <LogOut size={18} />
          </button>
        </form>
      </div>

      {shopName && (
        <div className="mb-2 hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs md:flex">
          <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-400" : "bg-amber-400"}`} />
          {isLive ? "Live for customers" : "Draft — not visible"}
        </div>
      )}

      <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-gold text-ink" : "text-cream/70 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <Icon size={18} />
              {it.label}
              {it.href === "/barber/queue" && (queueCount ?? 0) > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    active ? "bg-ink text-gold" : "bg-gold text-ink"
                  }`}
                >
                  {queueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-1 md:block">
        {isLive && shopSlug && (
          <Link
            href={`/shop/${shopSlug}`}
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5 hover:text-cream"
          >
            <ExternalLink size={18} /> View my public page
          </Link>
        )}
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-cream/60 transition hover:bg-white/5 hover:text-cream">
            <LogOut size={18} /> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
