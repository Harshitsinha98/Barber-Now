"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Scissors, Menu, X, User, LogOut, Store, CalendarCheck } from "lucide-react";
import { logoutCustomer } from "@/app/auth-actions";

const links = [
  { href: "/#discover", label: "Discover" },
  { href: "/#how", label: "How it works" },
  { href: "/bookings", label: "My Bookings" },
];

export function Navbar({ userLabel }: { userLabel?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isLoggedIn = Boolean(userLabel);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/85 backdrop-blur-md">
      <nav className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-gold">
            <Scissors size={18} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            Barber<span className="text-gold">Now</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-ink ${
                pathname === l.href ? "text-ink" : "text-ink/65"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/barber/login"
            className="flex items-center gap-1.5 text-sm font-medium text-ink/65 hover:text-ink"
          >
            <Store size={15} /> For barbers
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                href="/account"
                className="flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-sm font-medium text-ink hover:bg-black/10"
              >
                <User size={15} className="text-gold-dark" />
                {userLabel}
              </Link>
              <form action={logoutCustomer}>
                <button
                  className="rounded-full p-2 text-ink/50 hover:bg-black/5 hover:text-ink"
                  type="submit"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-gold text-sm">
              Sign in
            </Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-black/5 bg-cream md:hidden">
          <div className="container-app flex flex-col gap-1 py-4">
            {links.map((l) => (
              <MobileLink key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </MobileLink>
            ))}
            <MobileLink href="/barber/login" onClick={() => setOpen(false)}>
              <Store size={16} /> For barbers
            </MobileLink>
            {isLoggedIn ? (
              <>
                <MobileLink href="/account" onClick={() => setOpen(false)}>
                  <User size={16} className="text-gold-dark" /> {userLabel}
                </MobileLink>
                <form action={logoutCustomer}>
                  <button type="submit" className="btn-outline mt-2 w-full text-sm">
                    <LogOut size={16} /> Logout
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="btn-gold mt-2 text-sm">
                <CalendarCheck size={16} /> Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-black/5"
    >
      {children}
    </Link>
  );
}
