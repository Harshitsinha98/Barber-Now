import Link from "next/link";
import Image from "next/image";
import type { Shop } from "@/lib/types";
import { priceLevelLabel, formatDistance } from "@/lib/utils";
import { Stars } from "./Stars";
import { QueueBadge } from "./QueueBadge";
import { MapPin, Navigation } from "lucide-react";

export function ShopCard({
  shop,
  distanceKm,
}: {
  shop: Shop;
  /** Live distance from the user's device; falls back to the shop's static value. */
  distanceKm?: number;
}) {
  const dist = distanceKm ?? shop.distanceKm;
  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-premium"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={shop.coverImage}
          alt={shop.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-3 top-3">
          <QueueBadge shop={shop} />
        </div>
        <span
          className={`badge absolute right-3 top-3 ${
            shop.openNow ? "bg-emerald-500 text-white" : "bg-ink/80 text-cream"
          }`}
        >
          {shop.openNow ? "Open now" : "Closed"}
        </span>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium text-cream">
          <Navigation size={12} className="text-gold" />
          {formatDistance(dist)} away
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-ink">
            {shop.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-gold-dark">
            {priceLevelLabel(shop.priceLevel)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-ink/60">{shop.tagline}</p>

        <div className="mt-3 flex items-center gap-2">
          <Stars rating={shop.rating} showValue count={shop.reviewCount} />
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-ink/50">
          <MapPin size={12} />
          {shop.area}, {shop.city}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
          <span className="text-xs text-ink/50">
            From{" "}
            <span className="font-semibold text-ink">
              ₹{Math.min(...shop.services.map((s) => s.price))}
            </span>
          </span>
          <span className="text-sm font-semibold text-gold-dark group-hover:text-ink">
            Book now →
          </span>
        </div>
      </div>
    </Link>
  );
}
