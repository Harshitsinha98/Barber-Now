import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBookingDetail } from "@/lib/shops";
import { getSessionUser } from "@/lib/auth";
import { formatINR, BOOKING_STATUS_LABEL } from "@/lib/utils";
import { QueueTracker } from "@/components/QueueTracker";
import { CancelBookingButton, ReviewForm, SongRequestEditor } from "@/components/BookingActions";
import { ShareBookingButton } from "@/components/ShareBookingButton";
import { getQueueStatus } from "../actions";
import {
  CheckCircle2,
  MapPin,
  CalendarClock,
  Scissors,
  User,
  XCircle,
  Navigation,
} from "lucide-react";

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!(await getSessionUser())) redirect(`/login?next=${encodeURIComponent(`/booking/confirm?id=${id ?? ""}`)}`);
  const booking = id ? await getBookingDetail(id) : null;
  if (!booking) notFound();

  const { shop, mode, slotTime, serviceNames, totalDuration, totalAmount, barberName, status } =
    booking;
  const shortId = "BN" + booking.id.slice(0, 6).toUpperCase();
  const active = status === "booked" || status === "in_queue" || status === "in_service";
  const cancellable = status === "booked" || status === "in_queue";
  const queueStatus = mode === "queue" && active ? await getQueueStatus(booking.id) : null;
  const statusMeta = BOOKING_STATUS_LABEL[status] ?? BOOKING_STATUS_LABEL.booked;

  const header =
    status === "cancelled" || status === "no_show"
      ? { icon: <XCircle size={34} />, cls: "bg-rose-100 text-rose-600", title: "Booking cancelled", sub: "This booking is no longer active." }
      : status === "done"
        ? { icon: <CheckCircle2 size={34} />, cls: "bg-emerald-100 text-emerald-600", title: "Visit completed", sub: "Hope you loved your new look!" }
        : mode === "queue"
          ? { icon: <CheckCircle2 size={34} />, cls: "bg-emerald-100 text-emerald-600", title: "You're in the queue!", sub: "Relax — keep this page open, it updates live." }
          : { icon: <CheckCircle2 size={34} />, cls: "bg-emerald-100 text-emerald-600", title: "Booking confirmed!", sub: `See you at ${slotTime}. Booking ID ${shortId}` };

  const mapsUrl =
    shop.lat && shop.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name}, ${shop.area}, ${shop.city}`)}`;

  return (
    <div className="container-app max-w-3xl py-10">
      <div className="animate-fade-up text-center">
        <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${header.cls}`}>
          {header.icon}
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">{header.title}</h1>
        <p className="mt-1 text-ink/60">{header.sub}</p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Booking details</h2>
            <span className={`badge ${statusMeta.cls}`}>{statusMeta.label}</span>
          </div>
          <p className="mt-1 text-xs text-ink/40">ID: {shortId}</p>

          <div className="mt-4 space-y-3 text-sm">
            <Row icon={<Scissors size={15} />} label="Shop" value={shop.name} />
            <Row icon={<MapPin size={15} />} label="Location" value={[shop.area, shop.city].filter(Boolean).join(", ")} />
            <Row icon={<User size={15} />} label="Barber" value={barberName || "Any available"} />
            <Row
              icon={<CalendarClock size={15} />}
              label={mode === "slot" ? "Slot" : "Type"}
              value={
                mode === "slot"
                  ? `${slotTime ?? "—"} · ${new Date(booking.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                  : "Virtual queue (walk-in)"
              }
            />
            {(shop.acceptsSongRequests || booking.songRequest) && (
              <SongRequestEditor
                bookingId={booking.id}
                initial={booking.songRequest}
                editable={cancellable && shop.acceptsSongRequests}
              />
            )}
          </div>

          <div className="mt-4 border-t border-black/10 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">
              Services · {totalDuration} min
            </p>
            <ul className="space-y-1 text-sm text-ink/70">
              {serviceNames.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-black/10 pt-3 font-bold text-ink">
              <span>Total (pay at shop)</span>
              <span>{formatINR(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {queueStatus ? (
            <QueueTracker bookingId={booking.id} initial={queueStatus} />
          ) : mode === "slot" && active ? (
            <div className="card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gold-dark">
                <CalendarClock size={16} /> Your appointment
              </div>
              <p className="mt-3 font-display text-4xl font-bold text-ink">{slotTime}</p>
              <p className="text-ink/60">Today</p>
              <p className="mt-4 rounded-lg bg-black/5 p-3 text-xs text-ink/50">
                Please arrive 5 minutes early so your slot isn&apos;t missed.
              </p>
            </div>
          ) : status === "done" ? (
            <div className="card p-6">
              {booking.reviewed ? (
                <p className="text-sm font-medium text-emerald-700">You reviewed this visit. Thank you! ⭐</p>
              ) : (
                <ReviewForm bookingId={booking.id} shopName={shop.name} />
              )}
            </div>
          ) : null}

          {active && (
            <div className="card flex flex-wrap items-center gap-3 p-4">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                <Navigation size={15} /> Directions
              </a>
              <ShareBookingButton
                text={`I'm booked at ${shop.name} (${[shop.address, shop.area, shop.city].filter(Boolean).join(", ")})${
                  mode === "slot" && slotTime ? ` at ${slotTime}` : " — in the live queue"
                }. Booking ${shortId} via BarberNow. Directions: ${mapsUrl}`}
              />
              {cancellable && <CancelBookingButton bookingId={booking.id} />}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/bookings" className="btn-gold">View my bookings</Link>
        <Link href={`/shop/${shop.slug}`} className="btn-outline">Back to shop</Link>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-ink/60">{icon}</span>
      <div className="flex-1">
        <p className="text-xs text-ink/40">{label}</p>
        <p className="font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
