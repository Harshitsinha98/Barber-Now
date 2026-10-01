import { requireBarberShop } from "@/lib/barber";
import type { BookingRow, ServiceRow, BarberRow } from "@/lib/supabase/database.types";
import { formatINR, youtubeSearchUrl } from "@/lib/utils";
import { AutoRefresh } from "@/components/AutoRefresh";
import { startService, markDone, skipBooking, cancelBooking } from "./actions";
import { WalkInForm } from "./WalkInForm";
import {
  Users,
  Clock,
  CalendarClock,
  Play,
  Check,
  SkipForward,
  X,
  Scissors,
  Phone,
  Smartphone,
  Footprints,
  Music,
} from "lucide-react";

function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** "06:30 PM" → minutes since midnight (for sorting slots). */
function slotMinutes(s: string | null): number {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s ?? "");
  if (!m) return 24 * 60;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
}

export default async function QueuePage() {
  const { supabase, shop } = await requireBarberShop();
  const today = istToday();

  const [{ data: bookingData }, { data: serviceData }, { data: barberData }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("booking_date", today)
      .order("created_at", { ascending: true }),
    supabase.from("services").select("*").eq("shop_id", shop.id).order("created_at"),
    supabase.from("barbers").select("*").eq("shop_id", shop.id).eq("is_active", true),
  ]);

  const bookings = (bookingData as BookingRow[]) ?? [];
  const services = (serviceData as ServiceRow[]) ?? [];
  const barbers = (barberData as BarberRow[]) ?? [];
  const serviceMap = new Map(services.map((s) => [s.id, s]));
  const barberMap = new Map(barbers.map((b) => [b.id, b.name]));

  const inChair = bookings.filter((b) => b.status === "in_service");
  const waiting = bookings.filter((b) => b.status === "in_queue");
  const slots = bookings
    .filter((b) => b.status === "booked")
    .sort((a, b) => slotMinutes(a.slot_time) - slotMinutes(b.slot_time));
  const finished = bookings.filter((b) => ["done", "no_show", "cancelled"].includes(b.status)).reverse();
  const doneRevenue = bookings.filter((b) => b.status === "done").reduce((a, b) => a + b.total_amount, 0);

  const nowMinutes = (() => {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    return Number(p.find((x) => x.type === "hour")?.value) * 60 + Number(p.find((x) => x.type === "minute")?.value);
  })();

  function names(ids: string[]) {
    return ids.map((id) => serviceMap.get(id)?.name).filter(Boolean).join(", ") || "Service";
  }
  function minutes(ids: string[]) {
    return ids.reduce((a, id) => a + (serviceMap.get(id)?.duration_minutes ?? 0), 0);
  }

  const card = (b: BookingRow, i: number | null) => (
    <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold ${
          b.status === "in_service" ? "bg-emerald-500 text-white" : "bg-ink text-gold"
        }`}
      >
        {b.status === "in_service" ? <Scissors size={18} /> : b.mode === "slot" ? <Clock size={18} /> : i}
      </span>

      <div className="min-w-[180px] flex-1">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
          {b.customer_name || "Customer"}
          {b.customer_id ? (
            <span className="badge bg-blue-50 text-blue-700"><Smartphone size={10} /> App</span>
          ) : (
            <span className="badge bg-black/5 text-ink/60"><Footprints size={10} /> Walk-in</span>
          )}
          {b.mode === "slot" && b.slot_time && (
            <span className="badge bg-gold/15 text-gold-dark"><Clock size={10} /> {b.slot_time}</span>
          )}
        </p>
        <p className="text-sm text-ink/60">
          {names(b.service_ids)} · {minutes(b.service_ids)} min · {formatINR(b.total_amount)}
        </p>
        {b.song_request && (
          <a
            href={youtubeSearchUrl(b.song_request)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              b.status === "in_service"
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-gold/15 text-gold-dark hover:bg-gold/25"
            }`}
            title="Open on YouTube"
          >
            <Music size={12} className="shrink-0" />
            <span className="truncate">{b.song_request}</span>
            <span className="shrink-0 opacity-80">▶ Play</span>
          </a>
        )}
        <p className="flex flex-wrap items-center gap-3 text-xs text-ink/40">
          {b.barber_id && barberMap.get(b.barber_id) && <span>✂️ {barberMap.get(b.barber_id)}</span>}
          {b.customer_phone && (
            <a href={`tel:+91${b.customer_phone}`} className="flex items-center gap-1 text-gold-dark hover:underline">
              <Phone size={11} /> {b.customer_phone}
            </a>
          )}
          <span>
            Joined {new Date(b.created_at).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" })}
          </span>
        </p>
      </div>

      <div className="flex gap-2">
        {b.status !== "in_service" && (
          <form action={startService}>
            <input type="hidden" name="id" value={b.id} />
            <button className="btn-outline px-3 py-2 text-xs"><Play size={14} /> Start</button>
          </form>
        )}
        <form action={markDone}>
          <input type="hidden" name="id" value={b.id} />
          <button className="btn-gold px-3 py-2 text-xs"><Check size={14} /> Done</button>
        </form>
        {b.status !== "in_service" && (
          <form action={skipBooking}>
            <input type="hidden" name="id" value={b.id} />
            <button className="rounded-full border border-black/10 p-2 text-ink/50 hover:bg-black/5" title="No-show">
              <SkipForward size={14} />
            </button>
          </form>
        )}
        <form action={cancelBooking}>
          <input type="hidden" name="id" value={b.id} />
          <button className="rounded-full border border-black/10 p-2 text-ink/50 hover:bg-rose-50 hover:text-rose-600" title="Cancel">
            <X size={14} />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-5 sm:p-8">
      <AutoRefresh seconds={15} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">Live queue</h1>
          <p className="text-sm text-ink/60">
            Today · updates automatically · {shop.open_now ? "accepting walk-ins" : "walk-ins closed"}
          </p>
        </div>
        <WalkInForm
          services={services.filter((s) => s.is_active).map((s) => ({ id: s.id, name: s.name, price: s.price }))}
          barbers={barbers.map((b) => ({ id: b.id, name: b.name }))}
          songs={shop.accepts_song_requests === true}
        />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-lg">
        <Mini label="Waiting" value={waiting.length + slots.length} />
        <Mini label="In chair" value={inChair.length} />
        <Mini label="Earned" value={formatINR(doneRevenue)} />
      </div>

      {inChair.length + waiting.length + slots.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-10 text-center">
          <CalendarClock size={32} className="text-ink/20" />
          <p className="mt-3 font-medium text-ink">No one waiting right now</p>
          <p className="text-sm text-ink/50">App bookings show up here instantly. Add walk-ins with the button above.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {inChair.length > 0 && (
            <Section title="In the chair" icon={<Scissors size={18} />}>{inChair.map((b) => card(b, null))}</Section>
          )}
          {waiting.length > 0 && (
            <Section title={`Waiting in queue (${waiting.length})`} icon={<Users size={18} />}>
              {waiting.map((b, i) => card(b, i + 1))}
            </Section>
          )}
          {slots.length > 0 && (
            <Section title={`Slot bookings today (${slots.length})`} icon={<CalendarClock size={18} />}>
              {slots.map((b) => (
                <div key={b.id} className={slotMinutes(b.slot_time) < nowMinutes - 15 ? "opacity-60" : ""}>
                  {card(b, null)}
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {finished.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Finished today</h2>
          <div className="card divide-y divide-black/5">
            {finished.slice(0, 15).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 text-sm">
                <span
                  className={`badge ${
                    b.status === "done" ? "bg-emerald-50 text-emerald-700" : b.status === "no_show" ? "bg-black/5 text-ink/60" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {b.status === "done" ? "Done" : b.status === "no_show" ? "No-show" : "Cancelled"}
                </span>
                <span className="flex-1 text-ink/70">
                  {b.customer_name || "Customer"} · {names(b.service_ids)}
                </span>
                <span className="font-medium text-ink">{formatINR(b.total_amount)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
        <span className="text-gold-dark">{icon}</span> {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-ink px-4 py-3 text-cream">
      <p className="font-display text-xl font-bold text-gold">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-cream/60">{label}</p>
    </div>
  );
}
