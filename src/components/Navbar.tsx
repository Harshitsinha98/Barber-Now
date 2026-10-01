"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Scissors, Menu, X, User, LogOut, Store, Home, CalendarClock } from "lucide-react";
import { logoutCustomer } from "@/app/auth-actions";

const links = [
  { href: "/#discover", label: "Discover" },
  { href: "/#how", label: "How it works" },
  { href: "/bookings", label: "My Bookings" },
];

export function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 -rotate-6 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-coral text-ink shadow-glow">
        <Scissors size={18} strokeWidth={2.5} />
      </span>
      <span className={`font-display text-xl font-extrabold tracking-tight ${dark ? "text-cream" : "text-ink"}`}>
        barber<span className="text-gradient">now</span>
      </span>
    </Link>
  );
}

export function Navbar({ userLabel }: { userLabel?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isLoggedIn = Boolean(userLabel);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/85 text-cream backdrop-blur-xl">
        <nav className="container-app flex h-16 items-center justify-between">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-cream ${
                  pathname === l.href ? "text-cream" : "text-cream/60"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/barber/login"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-cream/60 hover:text-cream"
            >
              <Store size={15} /> For barbers
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/account"
                  className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-white/10"
                >
                  <User size={15} className="text-gold" />
                  {userLabel}
                </Link>
                <form action={logoutCustomer}>
                  <button className="rounded-full p-2 text-cream/50 hover:bg-white/5 hover:text-cream" title="Logout">
                    <LogOut size={16} />
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="btn-gold px-5 py-2 text-sm">
                Sign in
              </Link>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>

        {open && (
          <div className="border-t border-white/10 md:hidden">
            <div className="container-app flex flex-col gap-1 py-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-cream/80 hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/barber/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/80 hover:bg-white/5"
              >
                <Store size={16} /> For barbers
              </Link>
              {isLoggedIn ? (
                <form action={logoutCustomer}>
                  <button type="submit" className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-300">
                    <LogOut size={16} /> Logout
                  </button>
                </form>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="btn-gold mt-2 text-sm">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <MobileTabBar isLoggedIn={isLoggedIn} />
    </>
  );
}

/** App-style bottom navigation on phones. */
function MobileTabBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/bookings", label: "Bookings", icon: CalendarClock, active: pathname.startsWith("/booking") },
    {
      href: isLoggedIn ? "/account" : "/login",
      label: isLoggedIn ? "Account" : "Sign in",
      icon: User,
      active: pathname === "/account" || pathname === "/login",
    },
  ];

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 md:hidden">
      <div className="mx-auto flex max-w-sm items-center justify-around rounded-2xl border border-white/10 bg-ink/90 p-1.5 shadow-premium backdrop-blur-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition ${
                t.active ? "bg-white/10 text-gold" : "text-cream/50"
              }`}
            >
              <Icon size={19} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
