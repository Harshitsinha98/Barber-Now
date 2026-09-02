"use client";

import { useEffect, useState } from "react";
import type { Shop } from "@/lib/types";
import { BellRing, Users } from "lucide-react";

/**
 * Live virtual-queue tracker. Simulates the queue moving forward over time
 * (in a real app this would come from a WebSocket / Redis-backed queue).
 */
export function QueueTracker({ shop }: { shop: Shop }) {
  const start = Math.max(shop.queue.peopleAhead, 1);
  const [ahead, setAhead] = useState(start);

  useEffect(() => {
    if (ahead <= 0) return;
    const t = setInterval(() => {
      setAhead((n) => Math.max(0, n - 1));
    }, 6000); // demo: queue advances every 6s
    return () => clearInterval(t);
  }, [ahead]);

  const eta = ahead * shop.queue.avgServiceMinutes;
  const progress = ((start - ahead) / start) * 100;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-gold-dark">
        <Users size={16} /> Your live queue position
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-6xl font-bold leading-none text-ink">
          {ahead}
        </span>
        <span className="mb-1 text-ink/60">
          {ahead === 0 ? "It's your turn! 🎉" : "people ahead of you"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-ink/60">
          {ahead === 0 ? (
            "Please head to the shop now"
          ) : (
            <>
              Estimated wait{" "}
              <span className="font-semibold text-ink">
                {eta === 0 ? "any moment" : `~${eta} min`}
              </span>
            </>
          )}
        </span>
        {ahead <= 1 && ahead > 0 && (
          <span className="badge animate-pulse bg-rose-50 text-rose-700">
            <BellRing size={12} /> Almost your turn — leave now!
          </span>
        )}
      </div>

      <p className="mt-4 rounded-lg bg-black/5 p-3 text-xs text-ink/50">
        We&apos;ll notify you on WhatsApp &amp; SMS when it&apos;s almost your
        turn, so you can arrive just in time. (Demo: queue advances
        automatically.)
      </p>
    </div>
  );
}
