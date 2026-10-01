"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  CalendarClock,
  Users,
  Star,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { adminLogout } from "@/app/admin/actions";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/shops", label: "Shops", icon: Store },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export function AdminNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 z-40 flex w-full shrink-0 flex-col gap-1 border-b border-white/10 bg-[#0b0d12] p-3 text-cream md:h-screen md:w-60 md:border-b-0 md:border-r md:p-4">
      <div className="mb-2 flex items-center justify-between px-2 md:mb-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-ink">
            <ShieldCheck size={18} />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">
              Barber<span className="text-gold">Now</span>
            </p>
            <p className="text-xs text-cream/50">Admin console</p>
          </div>
        </Link>
        <form action={adminLogout} className="md:hidden">
          <button className="rounded-lg p-2 text-cream/60" title="Logout">
            <LogOut size={18} />
          </button>
        </form>
      </div>

      <nav className="no-scrollbar flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
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
              {it.href === "/admin/shops" && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-1 md:block">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/60 hover:bg-white/5 hover:text-cream"
        >
          <ExternalLink size={18} /> Open website
        </Link>
        <form action={adminLogout}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/60 hover:bg-white/5 hover:text-cream">
            <LogOut size={18} /> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
