"use client";

import { useEffect, useState } from "react";
import { BellRing, MapPin, Music, Scissors } from "lucide-react";

/**
 * Decorative product preview for the hero: a phone showing the live-queue
 * screen counting down. Purely illustrative (no real data).
 */
export function PhoneMockup() {
  const [ahead, setAhead] = useState(3);

  useEffect(() => {
    const t = setInterval(() => setAhead((n) => (n <= 0 ? 3 : n - 1)), 2600);
    return () => clearInterval(t);
  }, []);

  const pct = ((3 - ahead) / 3) * 100;

  return (
    <div className="relative mx-auto w-[280px] animate-float sm:w-[300px]" aria-hidden>
      {/* glow */}
      <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-gold/40 via-coral/30 to-transparent blur-3xl" />

      <div className="relative rounded-[2.6rem] border border-white/15 bg-ink-soft p-3 shadow-2xl">
        <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-black" />
        <div className="space-y-3 rounded-[2rem] bg-cream p-4 text-ink">
          <div className="flex items-center justify-between text-[11px] text-ink/50">
            <span className="flex items-center gap-1">
              <MapPin size={11} /> Glow Studio · 0.8 km
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
            </span>
          </div>

          <div className="rounded-2xl bg-ink p-4 text-cream">
            <p className="text-[11px] uppercase tracking-widest text-cream/50">Your position</p>
            <div className="mt-1 flex items-end gap-2">
              <span
                key={ahead}
                className="animate-fade-up font-display text-6xl font-bold leading-none text-gradient"
              >
                {ahead === 0 ? "🎉" : ahead}
              </span>
              <span className="mb-1 text-xs text-cream/60">
                {ahead === 0 ? "Your turn!" : "ahead of you"}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-coral transition-all duration-700"
                style={{ width: `${ahead === 0 ? 100 : pct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-cream/60">
              {ahead === 0 ? "Head in now" : `~${ahead * 15} min · stay home, we'll ping you`}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-card">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
              <Scissors size={14} />
            </span>
            <div className="flex-1 text-xs">
              <p className="font-semibold">Haircut + Threading</p>
              <p className="text-ink/50">55 min · ₹660</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs shadow-card">
            <Music size={14} className="text-coral" />
            <span className="truncate">Kesariya – Arijit Singh</span>
          </div>
        </div>
      </div>

      {/* floating notification */}
      <div
        className={`glass absolute -left-10 top-24 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs text-cream shadow-xl transition-all duration-500 sm:-left-16 ${
          ahead <= 1 ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
        }`}
      >
        <BellRing size={14} className="text-gold" />
        <span>
          <b>BarberNow</b> · You&apos;re next — leave now!
        </span>
      </div>
    </div>
  );
}
