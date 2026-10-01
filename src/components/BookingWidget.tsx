"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Shop, Service } from "@/lib/types";
import {
  formatINR,
  effectivePrice,
  buildSlots,
  istNowMinutes,
  summarize,
  waitLabel,
  estimatedWaitMinutes,
} from "@/lib/utils";
import { createBooking } from "@/app/(customer)/booking/actions";
import { QueueBadge } from "./QueueBadge";
import {
  Check,
  Clock,
  Tag,
  CalendarClock,
  Users,
  ChevronRight,
  LoaderCircle,
  Moon,
  Music,
} from "lucide-react";

type Mode = "queue" | "slot";

export function BookingWidget({
  shop,
  takenSlots = [],
}: {
  shop: Shop;
  takenSlots?: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [barberId, setBarberId] = useState<string>("any");
  const [mode, setMode] = useState<Mode>(shop.openNow ? "queue" : "slot");
  const [slot, setSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [song, setSong] = useState("");
  const [error, setError] = useState<string | null>(null);

  // IST "now" is only known on the client — avoids SSR/client mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(istNowMinutes()), []);
  const slots = useMemo(() => buildSlots(takenSlots, now), [takenSlots, now]);
  const anySlotFree = slots.some((s) => s.available);

  const chosen: Service[] = shop.services.filter((s) => selected[s.id]);
  const { total, originalTotal, duration } = summarize(chosen);
  const savings = originalTotal - total;
  const canBook =
    chosen.length > 0 && (mode === "queue" ? shop.openNow : Boolean(slot)) && !submitting;

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleBook() {
    setSubmitting(true);
    setError(null);
    const result = await createBooking({
      shopId: shop.id,
      serviceIds: chosen.map((s) => s.id),
      barberId: barberId === "any" ? null : barberId,
      mode,
      slotTime: mode === "slot" ? slot : null,
      songRequest: shop.acceptsSongRequests ? song : null,
    });

    if (!result.ok) {
      if (result.needsAuth) {
        router.push(`/login?next=${encodeURIComponent(`/shop/${shop.slug}`)}`);
        return;
      }
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/booking/confirm?id=${result.bookingId}`);
  }

  return (
    <div className="card sticky top-20 overflow-hidden">
      <div className="border-b border-black/5 bg-ink p-5 text-cream">
        <p className="text-xs uppercase tracking-widest text-gold">Book your visit</p>
        <p className="mt-1 font-display text-xl font-bold">
          {shop.openNow ? `Wait right now: ${waitLabel(estimatedWaitMinutes(shop))}` : "Closed right now"}
        </p>
      </div>

      <div className="p-5">
        {shop.openNow ? (
          <div className="mb-4">
            <QueueBadge shop={shop} size="lg" />
          </div>
        ) : (
          <p className="mb-4 flex items-center gap-2 rounded-xl bg-black/5 px-4 py-3 text-sm text-ink/70">
            <Moon size={16} /> The shop isn&apos;t taking walk-ins now. You can still book a slot.
          </p>
        )}

        {/* Mode toggle */}
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1">
          <button
            disabled={!shop.openNow}
            onClick={() => setMode("queue")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 ${
              mode === "queue" ? "bg-white text-ink shadow-sm" : "text-ink/60"
            }`}
          >
            <Users size={15} /> Join queue
          </button>
          <button
            onClick={() => setMode("slot")}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mode === "slot" ? "bg-white text-ink shadow-sm" : "text-ink/60"
            }`}
          >
            <CalendarClock size={15} /> Book slot
          </button>
        </div>

        {/* Services */}
        <Step n={1} title="Select services" />
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {shop.services.map((s) => {
            const isOn = !!selected[s.id];
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  isOn ? "border-gold bg-gold/10" : "border-black/10 hover:border-black/25"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    isOn ? "border-gold bg-gold text-ink" : "border-black/20"
                  }`}
                >
                  {isOn && <Check size={14} />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-ink">{s.name}</span>
                  <span className="flex items-center gap-2 text-xs text-ink/50">
                    <Clock size={11} /> {s.durationMinutes} min
                    {s.discountPercent ? (
                      <span className="badge bg-emerald-50 text-emerald-700">
                        <Tag size={10} /> {s.discountPercent}% off
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="text-right">
                  {s.discountPercent ? (
                    <span className="block text-xs text-ink/40 line-through">
                      {formatINR(s.price)}
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-ink">
                    {formatINR(effectivePrice(s))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Barber pick */}
        {shop.barbers.length > 0 && (
          <>
            <Step n={2} title="Choose barber" />
            <div className="flex flex-wrap gap-2">
              <Chip active={barberId === "any"} onClick={() => setBarberId("any")}>
                Any barber
              </Chip>
              {shop.barbers.map((b) => (
                <Chip key={b.id} active={barberId === b.id} onClick={() => setBarberId(b.id)}>
                  <Image
                    src={b.avatarUrl}
                    alt={b.name}
                    width={22}
                    height={22}
                    className="-ml-1.5 rounded-full"
                  />
                  {b.name.split(" ")[0]}
                </Chip>
              ))}
            </div>
          </>
        )}

        {/* Slots */}
        {mode === "slot" && (
          <>
            <Step n={shop.barbers.length > 0 ? 3 : 2} title="Pick a time · Today" />
            {now != null && !anySlotFree ? (
              <p className="rounded-xl bg-black/5 p-3 text-sm text-ink/60">
                No more slots today. Please check back tomorrow.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((sl) => (
                  <button
                    key={sl.time}
                    disabled={!sl.available}
                    onClick={() => setSlot(sl.time)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                      slot === sl.time
                        ? "border-gold bg-gold text-ink"
                        : sl.available
                          ? "border-black/10 text-ink/80 hover:border-gold"
                          : "cursor-not-allowed border-black/5 text-ink/25 line-through"
                    }`}
                  >
                    {sl.time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Song request (optional, only if the shop accepts them) */}
        {shop.acceptsSongRequests && (
          <div className="mt-5 rounded-xl border border-dashed border-gold/50 bg-gold/5 p-3">
            <label htmlFor="song" className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Music size={15} className="text-gold-dark" /> Request a song
              <span className="text-xs font-normal text-ink/40">(optional)</span>
            </label>
            <input
              id="song"
              value={song}
              onChange={(e) => setSong(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder="e.g. Kesariya – Arijit Singh"
              className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <p className="mt-1.5 text-[11px] text-ink/50">
              We&apos;ll try to play it while you&apos;re in the chair 🎶 — not guaranteed.
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-5 border-t border-black/10 pt-4">
          {chosen.length > 0 ? (
            <div className="mb-3 space-y-1 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>
                  {chosen.length} service{chosen.length > 1 ? "s" : ""} · {duration} min
                </span>
                {savings > 0 && (
                  <span className="text-emerald-600">You save {formatINR(savings)}</span>
                )}
              </div>
              <div className="flex justify-between text-lg font-bold text-ink">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>
          ) : (
            <p className="mb-3 text-sm text-ink/50">Select at least one service to continue.</p>
          )}

          <button disabled={!canBook} onClick={handleBook} className="btn-gold w-full">
            {submitting ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <>
                {mode === "queue" ? "Join virtual queue" : "Confirm slot"}
                <ChevronRight size={18} />
              </>
            )}
          </button>
          {error && <p className="mt-2 text-center text-xs text-rose-600">{error}</p>}
          <p className="mt-2 text-center text-xs text-ink/40">No advance payment · Pay at shop</p>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <h4 className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-ink first:mt-0">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-gold">
        {n}
      </span>
      {title}
    </h4>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
        active ? "border-gold bg-gold/10" : "border-black/10 hover:border-black/25"
      }`}
    >
      {children}
    </button>
  );
}
