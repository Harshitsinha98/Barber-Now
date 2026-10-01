import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getMyBookings, ACTIVE_STATUSES } from "@/lib/shops";
import { getSessionUser } from "@/lib/auth";
import { formatINR, BOOKING_STATUS_LABEL } from "@/lib/utils";
import { QueueBadge } from "@/components/QueueBadge";
import { CancelBookingButton, ReviewForm } from "@/components/BookingActions";
import { CalendarClock, MapPin, Clock, History, Search } from "lucide-react";

export default async function BookingsPage() {
  if (!(await getSessionUser())) redirect("/login?next=/bookings");

  const all = await getMyBookings();
  const upcoming = all.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const past = all.filter((b) => !ACTIVE_STATUSES.includes(b.status));
  const spent = past.filter((b) => b.status === "done").reduce((a, b) => a + b.totalAmount, 0);
  const visits = past.filter((b) => b.status === "done").length;

  return (
    <div className="container-app max-w-4xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My Bookings</h1>
          <p className="mt-1 text-ink/60">Track your queue, manage slots and view your history.</p>
        </div>
        {visits > 0 && (
          <div className="flex gap-3">
            <Pill value={String(visits)} label="Visits" />
            <Pill value={formatINR(spent)} label="Spent" />
          </div>
        )}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink">
          <CalendarClock size={20} className="text-gold-dark" /> Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center">
            <Search size={28} className="text-ink/20" />
            <p className="mt-2 font-medium text-ink">No active bookings</p>
            <p className="text-sm text-ink/50">Find a shop near you and skip the wait.</p>
            <Link href="/#discover" className="btn-gold mt-4 text-sm">Discover shops</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((b) => {
              const meta = BOOKING_STATUS_LABEL[b.status];
              return (
                <div key={b.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="relative h-24 w-full overflow-hidden rounded-xl sm:h-20 sm:w-28">
                    <Image src={b.shop.coverImage} alt={b.shop.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{b.shop.name}</h3>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      {b.mode === "queue" && <QueueBadge shop={b.shop} />}
                    </div>
                    <p className="text-sm text-ink/60">{b.serviceNames.join(", ") || "Service"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {b.shop.area}, {b.shop.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {b.mode === "slot" ? b.slotTime : "Walk-in queue"}
                      </span>
                      <span className="font-semibold text-ink">{formatINR(b.totalAmount)}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Link href={`/booking/confirm?id=${b.id}`} className="btn-primary px-4 py-2 text-xs">
                      {b.mode === "queue" ? "Track live" : "View"}
                    </Link>
                    {(b.status === "booked" || b.status === "in_queue") && (
                      <CancelBookingButton bookingId={b.id} compact />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink">
            <History size={20} className="text-gold-dark" /> History
          </h2>
          <div className="space-y-3">
            {past.map((b) => {
              const meta = BOOKING_STATUS_LABEL[b.status];
              return (
                <div key={b.id} className="card p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink">{b.shop.name}</h3>
                        <span className={`badge ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="text-sm text-ink/60">
                        {b.serviceNames.join(", ")} ·{" "}
                        {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink">{formatINR(b.totalAmount)}</span>
                    <Link href={`/shop/${b.shop.slug}`} className="btn-outline px-4 py-2 text-xs">
                      Book again
                    </Link>
                  </div>
                  {b.status === "done" && !b.reviewed && (
                    <div className="mt-4 border-t border-black/5 pt-4">
                      <ReviewForm bookingId={b.id} shopName={b.shop.name} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Pill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-ink px-4 py-2 text-center text-cream">
      <p className="font-display text-lg font-bold text-gold">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-cream/60">{label}</p>
    </div>
  );
}
