import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/data";
import { formatINR, summarize } from "@/lib/utils";
import { QueueTracker } from "@/components/QueueTracker";
import {
  CheckCircle2,
  MapPin,
  CalendarClock,
  Scissors,
  User,
  Phone,
  Share2,
} from "lucide-react";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{
    shop?: string;
    services?: string;
    barber?: string;
    mode?: string;
    slot?: string;
  }>;
}) {
  const sp = await searchParams;
  const shop = sp.shop ? getShopBySlug(sp.shop) : undefined;
  if (!shop) notFound();

  const serviceIds = (sp.services ?? "").split(",").filter(Boolean);
  const chosen = shop.services.filter((s) => serviceIds.includes(s.id));
  const barber =
    sp.barber && sp.barber !== "any"
      ? shop.barbers.find((b) => b.id === sp.barber)
      : null;
  const mode = sp.mode === "slot" ? "slot" : "queue";
  const { total, duration } = summarize(chosen);

  // Simple readable booking id
  const bookingId = "BN" + (shop.id + Date.now().toString().slice(-5));

  return (
    <div className="container-app max-w-3xl py-10">
      {/* Header */}
      <div className="animate-fade-up text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={34} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">
          {mode === "queue" ? "You're in the queue!" : "Booking confirmed!"}
        </h1>
        <p className="mt-1 text-ink/60">
          {mode === "queue"
            ? "Relax at home — we'll ping you when it's almost your turn."
            : `See you at your slot. Booking ID ${bookingId}`}
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Booking summary */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Booking details
          </h2>
          <p className="mt-1 text-xs text-ink/40">ID: {bookingId}</p>

          <div className="mt-4 space-y-3 text-sm">
            <Row icon={<Scissors size={15} />} label="Shop" value={shop.name} />
            <Row
              icon={<MapPin size={15} />}
              label="Location"
              value={`${shop.area}, ${shop.city}`}
            />
            <Row
              icon={<User size={15} />}
              label="Barber"
              value={barber ? barber.name : "Any available"}
            />
            <Row
              icon={<CalendarClock size={15} />}
              label={mode === "slot" ? "Slot" : "Type"}
              value={mode === "slot" ? (sp.slot ?? "—") : "Virtual queue (walk-in)"}
            />
          </div>

          <div className="mt-4 border-t border-black/10 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
              Services · {duration} min
            </p>
            <ul className="space-y-1 text-sm">
              {chosen.map((s) => (
                <li key={s.id} className="flex justify-between text-ink/70">
                  <span>{s.name}</span>
                  <span>{formatINR(s.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-black/10 pt-3 font-bold text-ink">
              <span>Total (pay at shop)</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>

        {/* Queue tracker or slot info */}
        <div className="space-y-4">
          {mode === "queue" ? (
            <QueueTracker shop={shop} />
          ) : (
            <div className="card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gold-dark">
                <CalendarClock size={16} /> Your appointment
              </div>
              <p className="mt-3 font-display text-4xl font-bold text-ink">
                {sp.slot}
              </p>
              <p className="text-ink/60">Today · {shop.openHours.split("–")[0].trim()} onwards</p>
              <p className="mt-4 rounded-lg bg-black/5 p-3 text-xs text-ink/50">
                Please arrive 5 minutes early. We&apos;ll send a reminder on
                WhatsApp &amp; SMS.
              </p>
            </div>
          )}

          <div className="card flex items-center gap-3 p-4">
            <Phone size={18} className="text-gold-dark" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-ink">Need to reschedule?</p>
              <p className="text-ink/50">Manage it from My Bookings anytime.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/bookings" className="btn-gold">
          View my bookings
        </Link>
        <Link href={`/shop/${shop.slug}`} className="btn-outline">
          Back to shop
        </Link>
        <button className="btn-outline">
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-ink/60">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-xs text-ink/40">{label}</p>
        <p className="font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
