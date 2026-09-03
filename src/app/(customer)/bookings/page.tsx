import Link from "next/link";
import Image from "next/image";
import { shops } from "@/lib/data";
import { formatINR } from "@/lib/utils";
import { QueueBadge } from "@/components/QueueBadge";
import { CalendarClock, MapPin, Clock, CheckCircle2, History } from "lucide-react";

// Mock "my bookings" derived from shop data for the demo
const upcoming = [
  {
    id: "BN10231",
    shop: shops[0],
    services: ["Haircut", "Beard Trim & Shape"],
    total: 400,
    type: "queue" as const,
    when: "In queue now",
  },
  {
    id: "BN10232",
    shop: shops[3],
    services: ["Premium Styling Cut"],
    total: 540,
    type: "slot" as const,
    when: "Today · 06:30 PM",
  },
];

const past = [
  {
    id: "BN09981",
    shop: shops[1],
    services: ["Royal Shave"],
    total: 320,
    when: "24 Aug 2026",
  },
];

export default function BookingsPage() {
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
        <div className="space-y-4">
          {upcoming.map((b) => (
            <div key={b.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-full overflow-hidden rounded-xl sm:h-20 sm:w-28">
                <Image src={b.shop.coverImage} alt={b.shop.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">{b.shop.name}</h3>
                  {b.type === "queue" && <QueueBadge shop={b.shop} />}
                </div>
                <p className="text-sm text-ink/60">{b.services.join(", ")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {b.shop.area}, {b.shop.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {b.when}
                  </span>
                  <span className="font-semibold text-ink">{formatINR(b.total)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/shop/${b.shop.slug}`} className="btn-outline text-xs">
                  View
                </Link>
                <button className="btn-primary text-xs">
                  {b.type === "queue" ? "Track queue" : "Reschedule"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-ink">
          <History size={20} className="text-gold-dark" /> Past visits
        </h2>
        <div className="space-y-3">
          {past.map((b) => (
            <div key={b.id} className="card flex items-center gap-4 p-4 opacity-90">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={20} />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-ink">{b.shop.name}</h3>
                <p className="text-sm text-ink/60">
                  {b.services.join(", ")} · {b.when}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink">{formatINR(b.total)}</span>
              <Link href={`/shop/${b.shop.slug}`} className="btn-outline text-xs">
                Book again
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Empty-state hint */}
      <div className="mt-10 rounded-2xl border border-dashed border-black/15 p-8 text-center">
        <p className="text-ink/60">Looking for your next fresh cut?</p>
        <Link href="/#discover" className="btn-gold mt-3">
          Discover shops near you
        </Link>
      </div>
    </div>
  );
}
