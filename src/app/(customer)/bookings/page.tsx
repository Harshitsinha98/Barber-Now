import Link from "next/link";
import Image from "next/image";
import { getMyBookings } from "@/lib/shops";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { QueueBadge } from "@/components/QueueBadge";
import {
  CalendarClock,
  MapPin,
  Clock,
  CheckCircle2,
  History,
  XCircle,
} from "lucide-react";

const ACTIVE = ["booked", "in_queue", "in_service"];

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container-app max-w-2xl py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">My Bookings</h1>
        <p className="mt-2 text-ink/60">
          Sign in to see your bookings and track your queue.
        </p>
        <Link href="/login?next=/bookings" className="btn-gold mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  const all = await getMyBookings();
  const upcoming = all.filter((b) => ACTIVE.includes(b.status));
  const past = all.filter((b) => !ACTIVE.includes(b.status));

  return (
    <div className="container-app max-w-4xl py-10">
      <h1 className="font-display text-3xl font-bold text-ink">My Bookings</h1>
      <p className="mt-1 text-ink/60">
        Track your queue, manage slots and view your grooming history.
      </p>

      {/* Upcoming */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink">
          <CalendarClock size={20} className="text-gold-dark" /> Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <div className="card p-6 text-sm text-ink/50">
            No active bookings. Discover a shop to book your next cut.
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-full overflow-hidden rounded-xl sm:h-20 sm:w-28">
                  <Image
                    src={b.shop.coverImage}
                    alt={b.shop.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{b.shop.name}</h3>
                    {b.mode === "queue" && <QueueBadge shop={b.shop} />}
                  </div>
                  <p className="text-sm text-ink/60">
                    {b.serviceNames.join(", ") || "Service"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {b.shop.area}, {b.shop.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {b.mode === "slot" ? b.slotTime : "In queue"}
                    </span>
                    <span className="font-semibold text-ink">
                      {formatINR(b.totalAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/booking/confirm?id=${b.id}`}
                    className="btn-outline text-xs"
                  >
                    {b.mode === "queue" ? "Track queue" : "View"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink">
            <History size={20} className="text-gold-dark" /> Past
          </h2>
          <div className="space-y-3">
            {past.map((b) => {
              const cancelled = b.status === "cancelled" || b.status === "no_show";
              return (
                <div
                  key={b.id}
                  className="card flex items-center gap-4 p-4 opacity-90"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      cancelled
                        ? "bg-rose-100 text-rose-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {cancelled ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink">{b.shop.name}</h3>
                    <p className="text-sm text-ink/60">
                      {b.serviceNames.join(", ")} ·{" "}
                      {new Date(b.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                      {cancelled ? " · Cancelled" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink">
                    {formatINR(b.totalAmount)}
                  </span>
                  <Link
                    href={`/shop/${b.shop.slug}`}
                    className="btn-outline text-xs"
                  >
                    Book again
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Discover CTA */}
      <div className="mt-10 rounded-2xl border border-dashed border-black/15 p-8 text-center">
        <p className="text-ink/60">Looking for your next fresh cut?</p>
        <Link href="/#discover" className="btn-gold mt-3">
          Discover shops near you
        </Link>
      </div>
    </div>
  );
}
