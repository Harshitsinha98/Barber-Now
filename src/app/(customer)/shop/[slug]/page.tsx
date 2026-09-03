import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShopBySlug, shops } from "@/lib/data";
import { priceLevelLabel } from "@/lib/utils";
import { Stars } from "@/components/Stars";
import { Gallery } from "@/components/Gallery";
import { BookingWidget } from "@/components/BookingWidget";
import {
  MapPin,
  Clock,
  ChevronLeft,
  BadgeCheck,
  Scissors,
} from "lucide-react";

export function generateStaticParams() {
  return shops.map((s) => ({ slug: s.slug }));
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = getShopBySlug(slug);
  if (!shop) notFound();

  return (
    <div className="bg-cream">
      {/* Cover */}
      <div className="relative h-64 w-full sm:h-80">
        <Image
          src={shop.coverImage}
          alt={shop.name}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="container-app absolute inset-x-0 top-4">
          <Link
            href="/#discover"
            className="inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm text-cream backdrop-blur hover:bg-black/60"
          >
            <ChevronLeft size={16} /> Back
          </Link>
        </div>
        <div className="container-app absolute inset-x-0 bottom-5 text-cream">
          <div className="flex items-center gap-2">
            <span className="badge bg-gold text-ink">
              <BadgeCheck size={12} /> Verified Partner
            </span>
            <span
              className={`badge ${
                shop.openNow ? "bg-emerald-500 text-white" : "bg-ink/70 text-cream"
              }`}
            >
              {shop.openNow ? "Open now" : "Closed"}
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {shop.name}
          </h1>
          <p className="text-cream/80">{shop.tagline}</p>
        </div>
      </div>

      <div className="container-app grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-8">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/70">
            <Stars rating={shop.rating} showValue count={shop.reviewCount} />
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-gold-dark" />
              {shop.address}, {shop.area}, {shop.city}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-gold-dark" />
              {shop.openHours}
            </span>
            <span className="font-semibold text-gold-dark">
              {priceLevelLabel(shop.priceLevel)}
            </span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2">
            {shop.amenities.map((a) => (
              <span key={a} className="badge bg-white text-ink/70 shadow-sm">
                {a}
              </span>
            ))}
          </div>

          {/* Gallery */}
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-ink">
              Photos
            </h2>
            <Gallery images={shop.gallery} name={shop.name} />
          </section>

          {/* Barbers */}
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-ink">
              Meet the barbers
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {shop.barbers.map((b) => (
                <div key={b.id} className="card flex items-center gap-3 p-3">
                  <Image
                    src={b.avatarUrl}
                    alt={b.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-ink">{b.name}</p>
                    <p className="text-xs text-ink/50">
                      {b.experienceYears} yrs · {b.specialities.join(", ")}
                    </p>
                  </div>
                  <Stars rating={b.rating} />
                </div>
              ))}
            </div>
          </section>

          {/* Services preview */}
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-ink">
              Services &amp; prices
            </h2>
            <div className="card divide-y divide-black/5">
              {shop.services.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-4">
                  <Scissors size={16} className="text-gold-dark" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-ink/50">{s.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-ink/50">{s.durationMinutes} min</span>
                  <span className="w-16 text-right font-semibold text-ink">
                    ₹{s.price}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="mb-3 font-display text-xl font-bold text-ink">
              Reviews ({shop.reviewCount})
            </h2>
            <div className="space-y-3">
              {shop.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{r.userName}</p>
                    <Stars rating={r.rating} />
                  </div>
                  <p className="mt-1 text-sm text-ink/70">{r.comment}</p>
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
          </section>
        </div>

        {/* RIGHT — booking */}
        <div>
          <BookingWidget shop={shop} />
        </div>
      </div>
    </div>
  );
}
