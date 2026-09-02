"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Shop, Service } from "@/lib/types";
import {
  formatINR,
  effectivePrice,
  generateSlots,
  summarize,
} from "@/lib/utils";
import { QueueBadge } from "./QueueBadge";
import {
  Check,
  Clock,
  Tag,
  CalendarClock,
  Users,
  ChevronRight,
} from "lucide-react";

type Mode = "queue" | "slot";

export function BookingWidget({ shop }: { shop: Shop }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [barberId, setBarberId] = useState<string>("any");
  const [mode, setMode] = useState<Mode>("queue");
  const [slot, setSlot] = useState<string | null>(null);

  const slots = useMemo(() => generateSlots(shop.id.length), [shop.id]);

  const chosen: Service[] = shop.services.filter((s) => selected[s.id]);
  const { total, originalTotal, duration } = summarize(chosen);
  const savings = originalTotal - total;

  const canBook = chosen.length > 0 && (mode === "queue" || slot);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleBook() {
    const params = new URLSearchParams({
      shop: shop.slug,
      services: chosen.map((s) => s.id).join(","),
      barber: barberId,
      mode,
      ...(slot ? { slot } : {}),
    });
    router.push(`/booking/confirm?${params.toString()}`);
  }

  return (
    <div className="card sticky top-20 p-5">
      <div className="mb-4">
        <QueueBadge shop={shop} size="lg" />
      </div>

      {/* Mode toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/5 p-1">
        <button
          onClick={() => setMode("queue")}
          className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
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
      <h4 className="mb-2 text-sm font-semibold text-ink">Select services</h4>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {shop.services.map((s) => {
          const isOn = !!selected[s.id];
          const price = effectivePrice(s);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                isOn
                  ? "border-gold bg-gold/10"
                  : "border-black/10 hover:border-black/25"
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
                <span className="block text-sm font-medium text-ink">
                  {s.name}
                </span>
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
                  {formatINR(price)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Barber pick */}
      <h4 className="mb-2 mt-4 text-sm font-semibold text-ink">Choose barber</h4>
      <div className="flex flex-wrap gap-2">
        <BarberChip
          active={barberId === "any"}
          onClick={() => setBarberId("any")}
          label="Any barber"
        />
        {shop.barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => setBarberId(b.id)}
            className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${
              barberId === b.id
                ? "border-gold bg-gold/10"
                : "border-black/10 hover:border-black/25"
            }`}
          >
            <Image
              src={b.avatarUrl}
              alt={b.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            {b.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Slots (only for slot mode) */}
      {mode === "slot" && (
        <>
          <h4 className="mb-2 mt-4 text-sm font-semibold text-ink">
            Pick a time · Today
          </h4>
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
        </>
      )}

      {/* Summary */}
      <div className="mt-5 border-t border-black/10 pt-4">
        {chosen.length > 0 ? (
          <div className="mb-3 space-y-1 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>{chosen.length} service(s) · {duration} min</span>
              {savings > 0 && (
                <span className="text-emerald-600">
                  You save {formatINR(savings)}
                </span>
              )}
            </div>
            <div className="flex justify-between text-lg font-bold text-ink">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        ) : (
          <p className="mb-3 text-sm text-ink/50">
            Select at least one service to continue.
          </p>
        )}

        <button
          disabled={!canBook}
          onClick={handleBook}
          className="btn-gold w-full"
        >
          {mode === "queue" ? "Join virtual queue" : "Confirm slot"}
          <ChevronRight size={18} />
        </button>
        <p className="mt-2 text-center text-xs text-ink/40">
          No advance payment · Pay at shop
        </p>
      </div>
    </div>
  );
}

function BarberChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active ? "border-gold bg-gold/10" : "border-black/10 hover:border-black/25"
      }`}
    >
      {label}
    </button>
  );
}
