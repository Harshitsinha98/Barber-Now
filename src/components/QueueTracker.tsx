"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getQueueStatus, type QueueStatus } from "@/app/(customer)/booking/actions";
import { BellRing, Users, Scissors, RefreshCw } from "lucide-react";

const POLL_MS = 10_000;

/**
 * Live virtual-queue position. Polls the server every 10s — the count comes
 * from real bookings ahead of this one, updated as the barber taps Done/Skip.
 */
export function QueueTracker({
  bookingId,
  initial,
}: {
  bookingId: string;
  initial: QueueStatus;
}) {
  const router = useRouter();
  const [state, setState] = useState<QueueStatus>(initial);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const startAhead = useRef(Math.max(initial.ahead, 1));
  const alerted = useRef(false);

  useEffect(() => {
    let alive = true;
    async function tick() {
      const next = await getQueueStatus(bookingId).catch(() => null);
      if (!alive || !next) return;
      setState(next);
      setUpdatedAt(new Date());
      // Status left the queue (served / cancelled) — refresh the page around it.
      if (!["booked", "in_queue"].includes(next.status)) router.refresh();
    }
    const t = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [bookingId, router]);

  // Browser notification + vibration when it's nearly your turn.
  useEffect(() => {
    if (state.ahead > 1 || alerted.current || state.status !== "in_queue") return;
    alerted.current = true;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(300);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("BarberNow", {
        body: state.ahead === 0 ? "It's your turn — head in now!" : "You're next — start heading to the shop.",
      });
    }
  }, [state.ahead, state.status]);

  if (state.status === "in_service") {
    return (
      <div className="card bg-emerald-50 p-6 text-center">
        <Scissors size={28} className="mx-auto text-emerald-600" />
        <p className="mt-2 font-display text-2xl font-bold text-emerald-800">You&apos;re in the chair</p>
        <p className="text-sm text-emerald-700">Enjoy your service!</p>
      </div>
    );
  }

  const ahead = state.ahead;
  const eta = ahead * state.avgMinutes;
  const progress = Math.min(100, ((startAhead.current - ahead) / startAhead.current) * 100);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between text-sm font-semibold text-gold-dark">
        <span className="flex items-center gap-2">
          <Users size={16} /> Your live queue position
        </span>
        <span className="flex items-center gap-1 text-xs font-normal text-ink/40">
          <RefreshCw size={11} className="animate-spin [animation-duration:3s]" />
          {updatedAt ? "Live" : "Connecting…"}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="font-display text-6xl font-bold leading-none text-ink">{ahead}</span>
        <span className="mb-1 text-ink/60">
          {ahead === 0 ? "You're next! 🎉" : ahead === 1 ? "person ahead of you" : "people ahead of you"}
        </span>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-gold transition-all duration-700 ease-out"
          style={{ width: `${ahead === 0 ? 100 : progress}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-ink/60">
          {ahead === 0 ? (
            "Please head to the shop now"
          ) : (
            <>
              Estimated wait <span className="font-semibold text-ink">~{eta} min</span>
            </>
          )}
        </span>
        {ahead <= 1 && (
          <span className="badge animate-pulse bg-rose-50 text-rose-700">
            <BellRing size={12} /> Leave now!
          </span>
        )}
      </div>

      <NotifyButton />
    </div>
  );
}

function NotifyButton() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => {
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);
  if (perm === "unsupported" || perm === "denied") return null;
  if (perm === "granted") {
    return (
      <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
        🔔 Alerts on — keep this page open and we&apos;ll notify you when you&apos;re next.
      </p>
    );
  }
  return (
    <button
      onClick={async () => setPerm(await Notification.requestPermission())}
      className="mt-4 w-full rounded-lg bg-black/5 p-3 text-xs font-medium text-ink/70 hover:bg-black/10"
    >
      🔔 Notify me when it&apos;s almost my turn
    </button>
  );
}
