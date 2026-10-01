import Link from "next/link";
import Image from "next/image";
import type { Shop } from "@/lib/types";
import { priceLevelLabel, formatDistance, effectivePrice, formatINR } from "@/lib/utils";
import { Stars } from "./Stars";
import { QueueBadge } from "./QueueBadge";
import { MapPin, Navigation, BadgeCheck } from "lucide-react";

export function ShopCard({
  shop,
  distanceKm,
}: {
  shop: Shop;
  /** Live distance from the user's device; hidden when unknown. */
  distanceKm?: number | null;
}) {
  const fromPrice = shop.services.length
    ? Math.min(...shop.services.map(effectivePrice))
    : null;
  const hasDiscount = shop.services.some((s) => s.discountPercent);

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute left-3 top-3">
          {shop.openNow ? (
            <QueueBadge shop={shop} />
          ) : (
            <span className="badge bg-ink/80 text-cream">Closed</span>
          )}
        </div>
        {hasDiscount && (
          <span className="badge absolute right-3 top-3 bg-emerald-500 text-white">Offers</span>
        )}
        {distanceKm != null && distanceKm > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs font-medium text-cream">
            <Navigation size={12} className="text-gold" />
            {formatDistance(distanceKm)} away
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-1.5 font-display text-lg font-bold leading-tight text-ink">
            {shop.name}
            {shop.isVerified && <BadgeCheck size={16} className="shrink-0 text-gold-dark" />}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-gold-dark">
            {priceLevelLabel(shop.priceLevel)}
          </span>
        </div>
        {shop.tagline && <p className="mt-0.5 line-clamp-1 text-sm text-ink/60">{shop.tagline}</p>}

        <div className="mt-3 flex items-center gap-2">
          <Stars rating={shop.rating} showValue count={shop.reviewCount} />
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-ink/50">
          <MapPin size={12} />
          {[shop.area, shop.city].filter(Boolean).join(", ")}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
          <span className="text-xs text-ink/50">
            {fromPrice != null && (
              <>
                From <span className="font-semibold text-ink">{formatINR(fromPrice)}</span>
              </>
            )}
          </span>
          <span className="text-sm font-semibold text-gold-dark group-hover:text-ink">
            Book now →
          </span>
        </div>
      </div>
    </Link>
  );
}
