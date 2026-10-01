import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getShopBySlug, getTakenSlots } from "@/lib/shops";
import { priceLevelLabel, formatINR, effectivePrice } from "@/lib/utils";
import { Stars } from "@/components/Stars";
import { Gallery } from "@/components/Gallery";
import { BookingWidget } from "@/components/BookingWidget";
import {
  MapPin,
  Clock,
  ChevronLeft,
  BadgeCheck,
  Scissors,
  Navigation,
  MessageSquareQuote,
  Tag,
} from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return { title: "Shop not found — BarberNow" };
  return {
    title: `${shop.name} — ${shop.area}, ${shop.city} | BarberNow`,
    description: shop.tagline || `Book ${shop.name} on BarberNow and skip the wait.`,
  };
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();
  const takenSlots = await getTakenSlots(shop.id);

  const mapsUrl =
    shop.lat && shop.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [shop.name, shop.address, shop.area, shop.city].filter(Boolean).join(", ")
        )}`;

  return (
    <div className="bg-cream">
      {/* Cover */}
      <div className="relative h-64 w-full sm:h-96">
        <Image src={shop.coverImage} alt={shop.name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="container-app absolute inset-x-0 top-4">
          <Link
            href="/#discover"
            className="inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm text-cream backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft size={16} /> All shops
          </Link>
        </div>
        <div className="container-app absolute inset-x-0 bottom-6 text-cream">
          <div className="flex flex-wrap items-center gap-2">
            {shop.isVerified && (
              <span className="badge bg-gold text-ink">
                <BadgeCheck size={12} /> Verified Partner
              </span>
            )}
            <span
              className={`badge ${shop.openNow ? "bg-emerald-500 text-white" : "bg-white/20 text-cream"}`}
            >
              {shop.openNow ? "Open now" : "Closed"}
            </span>
            <span className="badge bg-white/15 text-cream">{priceLevelLabel(shop.priceLevel)}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">{shop.name}</h1>
          {shop.tagline && <p className="mt-1 text-cream/80">{shop.tagline}</p>}
        </div>
      </div>

      <div className="container-app grid gap-8 py-8 lg:grid-cols-[1fr_400px]">
        {/* LEFT */}
        <div className="space-y-8">
          {/* Info strip */}
          <div className="card grid gap-4 p-5 sm:grid-cols-3">
            <Info icon={<Stars rating={shop.rating || 0} />} label="Rating">
              {shop.reviewCount > 0 ? `${shop.reviewCount} reviews` : "New on BarberNow"}
            </Info>
            <Info icon={<Clock size={18} className="text-gold-dark" />} label="Hours">
              {shop.openHours || "—"}
            </Info>
            <Info icon={<MapPin size={18} className="text-gold-dark" />} label="Location">
              {[shop.area, shop.city].filter(Boolean).join(", ")}
            </Info>
            {shop.address && (
              <p className="text-sm text-ink/60 sm:col-span-2">{shop.address}</p>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline justify-self-start text-sm sm:justify-self-end"
            >
              <Navigation size={15} /> Directions
            </a>
          </div>

          {shop.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {shop.amenities.map((a) => (
                <span key={a} className="badge bg-white text-ink/70 shadow-sm">
                  {a}
                </span>
              ))}
            </div>
          )}

          {shop.gallery.length > 0 && (
            <section>
              <SectionTitle>Photos</SectionTitle>
              <Gallery images={shop.gallery} name={shop.name} />
            </section>
          )}

          <section>
            <SectionTitle>Services &amp; prices</SectionTitle>
            <div className="card divide-y divide-black/5">
              {shop.services.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                    <Scissors size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      {s.name}
                      {s.discountPercent ? (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          <Tag size={10} /> {s.discountPercent}% off
                        </span>
                      ) : null}
                    </p>
                    {s.description && <p className="text-xs text-ink/50">{s.description}</p>}
                  </div>
                  <span className="text-xs text-ink/50">{s.durationMinutes} min</span>
                  <span className="w-20 text-right">
                    {s.discountPercent ? (
                      <span className="block text-xs text-ink/40 line-through">
                        {formatINR(s.price)}
                      </span>
                    ) : null}
                    <span className="font-semibold text-ink">{formatINR(effectivePrice(s))}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          {shop.barbers.length > 0 && (
            <section>
              <SectionTitle>Meet the team</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                {shop.barbers.map((b) => (
                  <div key={b.id} className="card flex items-center gap-3 p-3">
                    <Image
                      src={b.avatarUrl}
                      alt={b.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{b.name}</p>
                      <p className="text-xs text-ink/50">
                        {b.experienceYears > 0 ? `${b.experienceYears} yrs` : "Stylist"}
                        {b.specialities.length > 0 && ` · ${b.specialities.join(", ")}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <SectionTitle>
              Reviews {shop.reviewCount > 0 && `(${shop.reviewCount})`}
            </SectionTitle>
            {shop.reviews.length === 0 ? (
              <div className="card flex items-center gap-3 p-5 text-sm text-ink/60">
                <MessageSquareQuote size={20} className="text-ink/30" />
                No reviews yet — be the first after your visit.
              </div>
            ) : (
              <div className="space-y-3">
                {shop.reviews.slice(0, 10).map((r) => (
                  <div key={r.id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ink">{r.userName}</p>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-ink/70">{r.comment}</p>}
                    <p className="mt-1 text-xs text-ink/40">
                      {new Date(r.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT — booking */}
        <div>
          <BookingWidget shop={shop} takenSlots={takenSlots} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-display text-xl font-bold text-ink">{children}</h2>;
}

function Info({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/40">{label}</p>
        <p className="text-sm font-medium text-ink">{children}</p>
      </div>
    </div>
  );
}
