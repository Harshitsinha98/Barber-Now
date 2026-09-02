"use client";

import Link from "next/link";
import { useState } from "react";
import { Scissors, MapPin, Menu, X, CalendarCheck } from "lucide-react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#discover", label: "Discover" },
    { href: "/#how", label: "How it works" },
    { href: "/bookings", label: "My Bookings" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/80 backdrop-blur-md">
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
              className="text-sm font-medium text-ink/70 transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <span className="flex items-center gap-1 text-xs font-medium text-ink/60">
            <MapPin size={14} className="text-gold" /> New Delhi
          </span>
          <Link href="/login" className="btn-gold text-sm">
            Sign in
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-black/5 bg-cream md:hidden">
          <div className="container-app flex flex-col gap-1 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-black/5"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn-gold mt-2 text-sm"
            >
              <CalendarCheck size={16} /> Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
