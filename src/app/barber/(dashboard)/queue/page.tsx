import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyShop } from "@/lib/supabase/queries";
import type { BookingRow, ServiceRow } from "@/lib/supabase/database.types";
import { formatINR } from "@/lib/utils";
import { startService, markDone, skipBooking, cancelBooking } from "./actions";
import {
  Users,
  Clock,
  CalendarClock,
  Play,
  Check,
  SkipForward,
  X,
  Scissors,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  booked: { label: "Booked", cls: "bg-blue-50 text-blue-700" },
  in_queue: { label: "In queue", cls: "bg-amber-50 text-amber-700" },
  in_service: { label: "In chair", cls: "bg-emerald-50 text-emerald-700" },
};

export default async function QueuePage() {
  const shop = await getMyShop();
  if (!shop) redirect("/barber/onboarding");

  const supabase = await createClient();

  const [{ data: activeData }, { data: serviceData }, { data: doneData }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("shop_id", shop.id)
        .in("status", ["booked", "in_queue", "in_service"])
        .order("created_at", { ascending: true }),
      supabase.from("services").select("id, name").eq("shop_id", shop.id),
      supabase
        .from("bookings")
        .select("*")
        .eq("shop_id", shop.id)
        .eq("status", "done")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const active = (activeData as BookingRow[]) ?? [];
  const done = (doneData as BookingRow[]) ?? [];
  const serviceMap = new Map(
    ((serviceData as Pick<ServiceRow, "id" | "name">[]) ?? []).map((s) => [
      s.id,
      s.name,
    ])
  );

  function serviceNames(ids: string[]): string {
    const names = ids.map((id) => serviceMap.get(id)).filter(Boolean);
    return names.length ? names.join(", ") : "Service";
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Queue &amp; Bookings
          </h1>
          <p className="text-sm text-ink/60">
            Manage today&apos;s live queue. Tap to advance each customer.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-cream">
          <Users size={18} className="text-gold" />
          <span className="font-display text-xl font-bold">{active.length}</span>
          <span className="text-xs text-cream/60">in queue</span>
        </div>
      </div>

      {/* Active queue */}
      {active.length === 0 ? (
        <div className="mt-6 card flex flex-col items-center justify-center p-10 text-center">
          <CalendarClock size={32} className="text-ink/20" />
          <p className="mt-3 font-medium text-ink">No one in the queue</p>
          <p className="text-sm text-ink/50">
            New bookings from customers will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {active.map((b, i) => {
            const meta = STATUS_META[b.status] ?? STATUS_META.booked;
            return (
              <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-gold">
                  {i + 1}
                </span>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">
                      {serviceNames(b.service_ids)}
                    </p>
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    {b.mode === "slot" && b.slot_time && (
                      <span className="badge bg-black/5 text-ink/60">
                        <Clock size={11} /> {b.slot_time}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/50">
                    {formatINR(b.total_amount)} ·{" "}
                    {b.mode === "queue" ? "Walk-in queue" : "Slot booking"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {b.status !== "in_service" && (
                    <form action={startService}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="btn-outline text-xs" title="Start service">
                        <Play size={14} /> Start
                      </button>
                    </form>
                  )}
                  <form action={markDone}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="btn-gold text-xs" title="Mark done">
                      <Check size={14} /> Done
                    </button>
                  </form>
                  <form action={skipBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      className="rounded-full border border-black/10 p-2 text-ink/50 hover:bg-black/5"
                      title="No-show / skip"
                    >
                      <SkipForward size={14} />
                    </button>
                  </form>
                  <form action={cancelBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      className="rounded-full border border-black/10 p-2 text-ink/50 hover:bg-rose-50 hover:text-rose-600"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recently completed */}
      {done.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Scissors size={18} className="text-gold-dark" /> Recently completed
          </h2>
          <div className="card divide-y divide-black/5">
            {done.map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 opacity-80">
                <Check size={16} className="text-emerald-600" />
                <span className="flex-1 text-sm text-ink/70">
                  {serviceNames(b.service_ids)}
                </span>
                <span className="text-sm font-medium text-ink">
                  {formatINR(b.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
